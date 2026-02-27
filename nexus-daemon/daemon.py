"""
nexus-daemon: VPS 守护进程
每分钟 git pull 拉取新事件，运行进化引擎，生成改进建议推回仓库。
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from evolution_engine import EvolutionEngine

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
)
logger = logging.getLogger('nexus-daemon')


@dataclass
class DaemonConfig:
    poll_interval: int = 60
    openrouter_api_key: str = ''
    openrouter_model: str = 'anthropic/claude-3-5-haiku'
    telegram_token: str = ''
    telegram_chat_id: str = ''
    consciousness_interval: int = 300
    consciousness_budget_percent: int = 10


def load_config(config_path: Path) -> DaemonConfig:
    """Load config from JSON file, return defaults on missing/error."""
    try:
        if not config_path.exists():
            return DaemonConfig()
        raw = json.loads(config_path.read_text())
        return DaemonConfig(
            poll_interval=raw.get('poll_interval', 60),
            openrouter_api_key=raw.get('openrouter_api_key', ''),
            openrouter_model=raw.get('openrouter_model', 'anthropic/claude-3-5-haiku'),
            telegram_token=raw.get('telegram_token', ''),
            telegram_chat_id=raw.get('telegram_chat_id', ''),
            consciousness_interval=raw.get('consciousness_interval', 300),
            consciousness_budget_percent=raw.get('consciousness_budget_percent', 10),
        )
    except Exception:
        return DaemonConfig()


class NexusDaemon:
    """Core daemon: git pull loop + event processing."""

    PROCESSED_LOG = '.processed_events.json'

    def __init__(self, repo_path: Path, config: DaemonConfig | None = None):
        self.repo_path = Path(repo_path)
        self.config = config or DaemonConfig()
        self._processed: set[str] = set()
        self._ensure_dirs()
        self._load_processed_log()
        self._evolution_engine = EvolutionEngine(repo_path=self.repo_path)
        from telegram_bot import TelegramBot
        self._telegram = TelegramBot(
            token=self.config.telegram_token,
            chat_id=self.config.telegram_chat_id,
        )
        self._notified_improvements: dict[str, float] = {}
        from consciousness_loop import ConsciousnessLoop, ConsciousnessConfig
        self._consciousness = ConsciousnessLoop(
            repo_path=self.repo_path,
            config=ConsciousnessConfig(
                interval_seconds=self.config.consciousness_interval,
                budget_percent=self.config.consciousness_budget_percent,
            ),
        )

    def _ensure_dirs(self) -> None:
        for d in ['events', 'improvements', 'consciousness', 'evolution']:
            (self.repo_path / d).mkdir(parents=True, exist_ok=True)

    def _processed_log_path(self) -> Path:
        return self.repo_path / self.PROCESSED_LOG

    def _load_processed_log(self) -> None:
        try:
            path = self._processed_log_path()
            if path.exists():
                self._processed = set(json.loads(path.read_text()))
        except Exception:
            self._processed = set()

    def _save_processed_log(self) -> None:
        try:
            self._processed_log_path().write_text(
                json.dumps(sorted(self._processed), indent=2)
            )
        except Exception as e:
            logger.error('Failed to save processed log: %s', e)

    def git_pull(self) -> bool:
        """Pull latest from remote. Returns True on success."""
        try:
            result = subprocess.run(
                ['git', 'fetch', 'origin'],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode != 0:
                logger.warning('git fetch failed: %s', result.stderr.strip())
                return False
            result = subprocess.run(
                ['git', 'rebase', 'origin/main'],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0:
                logger.info('git pull: success')
                return True
            logger.warning('git pull failed: %s', result.stderr.strip())
            return False
        except Exception as e:
            logger.error('git pull error: %s', e)
            return False

    def git_push(self, message: str) -> bool:
        """Commit and push improvements. Returns True on success."""
        try:
            subprocess.run(['git', 'add', 'improvements/', 'evolution/'], cwd=self.repo_path,
                           capture_output=True, timeout=10)
            result = subprocess.run(
                ['git', 'commit', '-m', message],
                cwd=self.repo_path, capture_output=True, text=True, timeout=10,
            )
            if result.returncode != 0:
                return False
            subprocess.run(['git', 'push', 'origin', 'HEAD'],
                           cwd=self.repo_path, capture_output=True, timeout=30)
            return True
        except Exception as e:
            logger.error('git push error: %s', e)
            return False

    def get_new_events(self) -> list[dict[str, Any]]:
        """Return unprocessed event files from events/ directory."""
        events_dir = self.repo_path / 'events'
        result = []
        for f in sorted(events_dir.glob('*.json')):
            if f.name in self._processed:
                continue
            try:
                data = json.loads(f.read_text())
                data['_filename'] = f.name
                result.append(data)
            except Exception as e:
                logger.warning('Skipping malformed event file %s: %s', f.name, e)
                self.mark_event_processed(f.name)
        return result

    def mark_event_processed(self, filename: str) -> None:
        self._processed.add(filename)
        self._save_processed_log()

    async def run_once(self) -> None:
        """Single poll cycle: pull -> process events -> push."""
        self.git_pull()
        events = self.get_new_events()
        if not events:
            return
        logger.info('Processing %d new event(s)', len(events))
        new_events: list[dict[str, Any]] = []
        for event in events:
            try:
                await self._process_event(event)
                self.mark_event_processed(event['_filename'])
                new_events.append(event)
            except Exception as e:
                logger.error('Error processing event %s: %s', event.get('_filename'), e)
        if new_events:
            try:
                self._evolution_engine.process_events(new_events)
            except Exception as e:
                logger.error('Evolution engine failed to process events: %s', e)
        # Notify via Telegram for improvements needing review (with deduplication)
        if self._telegram.enabled:
            improvements_dir = self.repo_path / 'improvements'
            now = time.time()
            self._notified_improvements = {
                k: v for k, v in self._notified_improvements.items()
                if now - v < 86400
            }
            for f in sorted(improvements_dir.glob('*.json')):
                imp_id = f.stem
                if imp_id in self._notified_improvements:
                    continue
                try:
                    imp = json.loads(f.read_text())
                    if imp.get('status') == 'pending':
                        sent = await self._telegram.notify_improvement(imp)
                        if sent:
                            self._notified_improvements[imp_id] = time.time()
                except (json.JSONDecodeError, OSError) as e:
                    logger.warning('Failed to read improvement file %s: %s', f.name, e)
                except Exception as e:
                    logger.error('Unexpected error processing improvement %s: %s', f.name, e)

    async def _process_event(self, event: dict[str, Any]) -> None:
        """Placeholder: route to evolution engine."""
        logger.info('Event received: session=%s agents=%s',
                    event.get('sessionId', '?'),
                    event.get('agentsSpawned', 0))

    async def run(self) -> None:
        """Main daemon loop."""
        logger.info('nexus-daemon started (poll_interval=%ds)', self.config.poll_interval)
        tasks = [
            asyncio.create_task(self._main_loop()),
            asyncio.create_task(self._consciousness.run_loop()),
        ]
        await asyncio.gather(*tasks)

    async def _main_loop(self) -> None:
        """Git pull + evolution engine loop."""
        while True:
            try:
                await self.run_once()
            except Exception as e:
                logger.error('run_once error: %s', e)
            await asyncio.sleep(self.config.poll_interval)


def main() -> None:
    repo_path = Path(os.environ.get('NEXUS_REPO_PATH', '.'))
    config_path = repo_path / 'config.json'
    config = load_config(config_path)
    daemon = NexusDaemon(repo_path=repo_path, config=config)
    asyncio.run(daemon.run())


if __name__ == '__main__':
    main()

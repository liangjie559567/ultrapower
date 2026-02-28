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
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from evolution_engine import EvolutionEngine
from self_modifier import SelfModifier
from module_registry import ModuleRegistry

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
    consciousness_max_rounds_per_session: int = 5


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
            consciousness_max_rounds_per_session=raw.get('consciousness_max_rounds_per_session', 5),
        )
    except Exception:
        return DaemonConfig()


class GitSync:
    """Git pull/push operations."""

    def __init__(self, repo_path: Path):
        self.repo_path = Path(repo_path)

    def pull(self) -> bool:
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

    def push(self, message: str) -> bool:
        """Commit and push improvements. Returns True on success."""
        try:
            subprocess.run(['git', 'add', 'improvements/', 'evolution/', 'skills/', 'agents/'],
                           cwd=self.repo_path, capture_output=True, timeout=10)
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


class EventProcessor:
    """Event loading, validation, and processing."""

    PROCESSED_LOG = '.processed_events.json'
    REQUIRED_FIELDS: set[str] = {'sessionId'}

    def __init__(self, repo_path: Path):
        self.repo_path = Path(repo_path)
        self._processed: set[str] = set()
        self._load_processed_log()

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

    def _validate_event(self, event: dict) -> list[str]:
        """Warn-only schema validation. Returns list of warnings."""
        warnings: list[str] = []
        for f in self.REQUIRED_FIELDS:
            if f not in event:
                warnings.append(f'Missing required field: {f}')
        return warnings

    def get_new_events(self) -> list[dict[str, Any]]:
        """Return unprocessed event files from events/ directory."""
        events_dir = self.repo_path / 'events'
        result: list[dict[str, Any]] = []
        for f in sorted(events_dir.glob('*.json')):
            if f.name in self._processed:
                continue
            try:
                data = json.loads(f.read_text())
                data['_filename'] = f.name
                warnings = self._validate_event(data)
                for w in warnings:
                    logger.warning('Event %s validation: %s', f.name, w)
                result.append(data)
            except Exception as e:
                logger.warning('Skipping malformed event file %s: %s', f.name, e)
                self.mark_processed(f.name)
        return result

    def mark_processed(self, filename: str) -> None:
        self._processed.add(filename)
        self._save_processed_log()


class ImprovementManager:
    """Scan, auto-apply, and notify about improvements."""

    def __init__(self, repo_path: Path, modifier: SelfModifier, telegram: Any):
        self.repo_path = Path(repo_path)
        self._modifier = modifier
        self._telegram = telegram
        self._notified: dict[str, float] = {}

    async def scan_and_apply(self) -> None:
        improvements_dir = self.repo_path / 'improvements'
        now = time.time()
        self._notified = {
            k: v for k, v in self._notified.items()
            if now - v < 86400
        }
        for f in sorted(improvements_dir.glob('*.json')):
            imp_id = f.stem
            try:
                imp = json.loads(f.read_text())
                if imp.get('confidence', 0) >= 80 and imp.get('status') == 'pending':
                    result = self._modifier.apply(imp)
                    if result.status == 'applied':
                        imp['status'] = 'auto_applied'
                        f.write_text(
                            json.dumps(imp, indent=2, ensure_ascii=False),
                            encoding='utf-8',
                        )
                        logger.info('Auto-applied improvement %s', imp_id)
                if (self._telegram.enabled
                        and imp_id not in self._notified
                        and imp.get('status') == 'pending'):
                    sent = await self._telegram.notify_improvement(imp)
                    if sent:
                        self._notified[imp_id] = time.time()
            except (json.JSONDecodeError, OSError) as e:
                logger.warning('Failed to read improvement file %s: %s', f.name, e)
            except Exception as e:
                logger.error('Unexpected error processing improvement %s: %s', f.name, e)


class HealthReporter:
    """Generate health reports with anomaly detection and recommendations."""

    def __init__(self, repo_path: Path, evaluator: Any):
        self.repo_path = Path(repo_path)
        self._evaluator = evaluator
        self._last_report_date: str = ''

    async def generate_daily_report(
        self,
        events: list[dict],
        telegram: Any | None = None,
    ) -> None:
        from anomaly_detector import detect_anomalies_in_events
        from recommendation_engine import RecommendationEngine

        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        if today == self._last_report_date:
            return
        self._last_report_date = today

        try:
            report = self._evaluator.generate_report()
            md = self._evaluator.format_report(report)
        except Exception as e:
            logger.error('Failed to generate health report: %s', e)
            return

        # Anomaly detection
        anomalies = detect_anomalies_in_events(events, metric='agentsSpawned')

        # Recommendation engine
        rec_engine = RecommendationEngine()
        rec_engine.load_from_events(events)
        recommendations = rec_engine.recommend(n=3)

        # Append anomaly + recommendation sections
        if anomalies:
            md += '\n\n## Anomalies Detected\n'
            for a in anomalies:
                md += f'- index={a.index} value={a.value} score={a.score} severity={a.severity}\n'
        else:
            md += '\n\n## Anomalies Detected\nNone\n'

        if recommendations:
            md += '\n## Recommendations\n'
            for r in recommendations:
                md += f'- {r.name}: score={r.score} ({r.reason})\n'

        report_path = self.repo_path / 'consciousness' / f'health-{today}.md'
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(md)
        logger.info('Daily health report written: %s', report_path.name)

        if telegram and telegram.enabled:
            await telegram.send_message(f'Daily health report ready: {today}')

        return anomalies, recommendations


class NexusDaemon:
    """Refactored daemon: delegates to specialized components."""

    def __init__(self, repo_path: Path, config: DaemonConfig | None = None):
        self.repo_path = Path(repo_path)
        self.config = config or DaemonConfig()
        self._ensure_dirs()

        # Component initialization
        self._git = GitSync(self.repo_path)
        self._events = EventProcessor(self.repo_path)
        self._evolution_engine = EvolutionEngine(repo_path=self.repo_path)

        from telegram_bot import TelegramBot
        self._telegram = TelegramBot(
            token=self.config.telegram_token,
            chat_id=self.config.telegram_chat_id,
        )

        self._modifier = SelfModifier(repo_path=self.repo_path)
        self._improvements = ImprovementManager(
            self.repo_path, self._modifier, self._telegram,
        )

        from self_evaluator import SelfEvaluator
        self._evaluator = SelfEvaluator(repo_path=self.repo_path)
        self._health = HealthReporter(self.repo_path, self._evaluator)

        from consciousness_loop import ConsciousnessLoop, ConsciousnessConfig
        self._consciousness = ConsciousnessLoop(
            repo_path=self.repo_path,
            config=ConsciousnessConfig(
                interval_seconds=self.config.consciousness_interval,
                budget_percent=self.config.consciousness_budget_percent,
                max_rounds_per_session=self.config.consciousness_max_rounds_per_session,
            ),
        )

        # Module registry with circuit breaker
        self._registry = ModuleRegistry()
        self._registry.register('git_sync', self._git)
        self._registry.register('event_processor', self._events)
        self._registry.register('evolution_engine', self._evolution_engine)
        self._registry.register('improvement_manager', self._improvements)
        self._registry.register('health_reporter', self._health)

    def _ensure_dirs(self) -> None:
        for d in ['events', 'improvements', 'consciousness', 'evolution']:
            (self.repo_path / d).mkdir(parents=True, exist_ok=True)

    # --- Backward-compatible public API (delegates to components) ---

    def git_pull(self) -> bool:
        return self._git.pull()

    def git_push(self, message: str) -> bool:
        return self._git.push(message)

    def get_new_events(self) -> list[dict[str, Any]]:
        return self._events.get_new_events()

    def mark_event_processed(self, filename: str) -> None:
        self._events.mark_processed(filename)

    async def run_once(self) -> None:
        """Single poll cycle: pull -> process events -> push."""
        self._registry.run_safe('git_sync', self._git.pull)

        events = self._registry.run_safe(
            'event_processor', self._events.get_new_events,
        )
        if events is None:
            events = []

        if not events:
            self._write_status(0)
            return

        logger.info('Processing %d new event(s)', len(events))
        new_events: list[dict[str, Any]] = []
        for event in events:
            try:
                await self._process_event(event)
                self._events.mark_processed(event['_filename'])
                new_events.append(event)
            except Exception as e:
                logger.error(
                    'Error processing event %s: %s',
                    event.get('_filename'), e,
                )

        if new_events:
            self._registry.run_safe(
                'evolution_engine',
                self._evolution_engine.process_events,
                new_events,
            )

        # Scan improvements
        await self._registry.run_safe_async(
            'improvement_manager',
            self._improvements.scan_and_apply,
        )

        # Daily health report (captures anomalies for status)
        report_result = await self._registry.run_safe_async(
            'health_reporter',
            self._health.generate_daily_report,
            new_events,
            self._telegram,
        )

        anomalies = []
        recommendations = []
        if report_result is not None:
            anomalies, recommendations = report_result

        self._write_status(len(new_events), anomalies, recommendations)

    def _write_status(
        self,
        events_processed: int,
        anomalies: list | None = None,
        recommendations: list | None = None,
    ) -> None:
        """Write consciousness/status.md after each run_once."""
        now = datetime.now(timezone.utc).isoformat()
        registry_status = self._registry.get_status()
        breaker = registry_status.get('breaker', {})

        lines = [
            '# nexus Status',
            '',
            f'Last updated: {now}',
            f'Events processed this cycle: {events_processed}',
            '',
            '## Module Status',
        ]

        for mod in registry_status.get('modules', []):
            info = breaker.get(mod, {})
            state = 'blown' if info.get('blown') else 'ok'
            lines.append(f'- {mod}: {state}')

        lines.append('')
        lines.append('## Anomalies Detected')
        if anomalies:
            lines.append(f'- agentsSpawned: {len(anomalies)} anomalies')
        else:
            lines.append('- None')

        lines.append('')
        lines.append('## Recommendations')
        if recommendations:
            for r in recommendations[:3]:
                lines.append(f'- {r.name}: score={r.score}')
        else:
            lines.append('- None')

        status_path = self.repo_path / 'consciousness' / 'status.md'
        status_path.parent.mkdir(parents=True, exist_ok=True)
        status_path.write_text('\n'.join(lines) + '\n')

    async def _process_event(self, event: dict[str, Any]) -> None:
        """Placeholder: route to evolution engine."""
        logger.info(
            'Event received: session=%s agents=%s',
            event.get('sessionId', '?'),
            event.get('agentsSpawned', 0),
        )

    async def run(self) -> None:
        """Main daemon loop."""
        logger.info(
            'nexus-daemon started (poll_interval=%ds)',
            self.config.poll_interval,
        )
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

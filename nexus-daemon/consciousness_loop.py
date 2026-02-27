# nexus-daemon/consciousness_loop.py
from __future__ import annotations
import asyncio
import logging
import tempfile
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class ConsciousnessConfig:
    interval_seconds: int = 300
    budget_percent: int = 10  # TODO: enforce budget_percent when LLM calls are integrated
    max_rounds_per_session: int = 5


class ConsciousnessLoop:
    def __init__(self, repo_path: Path, config: ConsciousnessConfig):
        self.repo_path = repo_path
        self.config = config
        # _round_count is per-process-lifetime: resets to 0 on daemon restart.
        self._round_count = 0

    @property
    def scratchpad_path(self) -> Path:
        return self.repo_path / 'consciousness' / 'scratchpad.md'

    @property
    def rounds_dir(self) -> Path:
        return self.repo_path / 'consciousness' / 'rounds'

    def is_paused(self) -> bool:
        return (self.repo_path / '.nexus-busy').exists()

    def _write_scratchpad(self, content: str) -> None:
        self.scratchpad_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_fd, tmp_path = tempfile.mkstemp(
            dir=self.scratchpad_path.parent, suffix='.tmp'
        )
        try:
            with open(tmp_fd, 'w') as f:
                f.write(content)
            Path(tmp_path).replace(self.scratchpad_path)
        except Exception:
            Path(tmp_path).unlink(missing_ok=True)
            raise

    def _write_round_record(self, round_num: int, content: str) -> None:
        self.rounds_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        path = self.rounds_dir / f'round-{round_num:04d}-{ts}.md'
        path.write_text(content)

    async def run_once(self) -> Optional[str]:
        """Run one consciousness round. Returns scratchpad content or None if paused."""
        if self.is_paused():
            logger.debug('Skipping round: daemon is paused (.nexus-busy exists)')
            return None
        if self._round_count >= self.config.max_rounds_per_session:
            logger.debug(
                'Session cap reached (%d/%d rounds); skipping.',
                self._round_count,
                self.config.max_rounds_per_session,
            )
            return None

        self._round_count += 1
        logger.info('Starting consciousness round %d', self._round_count)
        ts = datetime.now(timezone.utc).isoformat()
        content = (
            f'# Consciousness Round {self._round_count}\n\n'
            f'**Timestamp:** {ts}\n\n'
            f'*Awaiting LLM reflection...*\n'
        )
        self._write_scratchpad(content)
        self._write_round_record(self._round_count, content)
        return content

    async def run_loop(self) -> None:
        """Continuous loop: run_once every interval_seconds."""
        session_cap_logged = False
        while True:
            try:
                result = await self.run_once()
                if result is None and self._round_count >= self.config.max_rounds_per_session:
                    if not session_cap_logged:
                        logger.info(
                            'Session cap of %d rounds reached; sleeping between attempts.',
                            self.config.max_rounds_per_session,
                        )
                        session_cap_logged = True
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception('Unhandled error in run_once; continuing loop.')
            await asyncio.sleep(self.config.interval_seconds)

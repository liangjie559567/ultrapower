# nexus-daemon/consciousness_loop.py
from __future__ import annotations
import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class ConsciousnessConfig:
    interval_seconds: int = 300
    budget_percent: int = 10
    max_rounds_per_session: int = 5


class ConsciousnessLoop:
    def __init__(self, repo_path: Path, config: ConsciousnessConfig):
        self.repo_path = repo_path
        self.config = config
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
        self.scratchpad_path.write_text(content)

    def _write_round_record(self, round_num: int, content: str) -> None:
        self.rounds_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        path = self.rounds_dir / f'round-{round_num:04d}-{ts}.md'
        path.write_text(content)

    async def run_once(self) -> Optional[str]:
        """Run one consciousness round. Returns scratchpad content or None if paused."""
        if self.is_paused():
            return None
        if self._round_count >= self.config.max_rounds_per_session:
            return None

        self._round_count += 1
        ts = datetime.utcnow().isoformat()
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
        while True:
            await self.run_once()
            await asyncio.sleep(self.config.interval_seconds)

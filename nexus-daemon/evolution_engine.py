from __future__ import annotations
import logging
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger('nexus.evolution')
PATTERN_THRESHOLD = 3


@dataclass
class PatternRecord:
    pattern_type: str
    value: str
    occurrences: int
    confidence: int
    first_seen: str
    last_seen: str
    evidence: list[str] = field(default_factory=list)


def detect_patterns(events: list[dict[str, Any]]) -> list[PatternRecord]:
    if not events:
        return []
    now = datetime.now(timezone.utc).isoformat()
    patterns: list[PatternRecord] = []
    mode_counter: Counter[str] = Counter()
    for event in events:
        for mode in event.get('modesUsed', []):
            mode_counter[mode] += 1
    for mode, count in mode_counter.items():
        confidence = min(100, 50 + count * 10)
        patterns.append(PatternRecord(
            pattern_type='mode_usage', value=mode, occurrences=count,
            confidence=confidence, first_seen=now, last_seen=now,
            evidence=[f'Appeared in {count} sessions'],
        ))
    return patterns


class EvolutionEngine:
    def __init__(self, repo_path: Path) -> None:
        self.repo_path = Path(repo_path)
        self._evolution_dir = self.repo_path / 'evolution'
        self._evolution_dir.mkdir(parents=True, exist_ok=True)
        self._kb_path = self._evolution_dir / 'knowledge_base.md'
        self._pl_path = self._evolution_dir / 'pattern_library.md'
        if not self._kb_path.exists():
            self._kb_path.write_text('# Nexus Knowledge Base\n\n', encoding='utf-8')
        if not self._pl_path.exists():
            self._pl_path.write_text('# Nexus Pattern Library\n\n', encoding='utf-8')

    def process_events(self, events: list[dict[str, Any]]) -> list[PatternRecord]:
        """Process events, detect patterns, update knowledge base and pattern library."""
        if not events:
            return []
        patterns = detect_patterns(events)
        promoted = [p for p in patterns if p.occurrences >= PATTERN_THRESHOLD]
        if promoted:
            self._update_knowledge_base(promoted, events)
            self._update_pattern_library(promoted)
        logger.info('Processed %d events, found %d patterns (%d promoted)',
                    len(events), len(patterns), len(promoted))
        return patterns

    def _update_knowledge_base(self, patterns: list[PatternRecord], events: list[dict[str, Any]]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        lines = [f'\n## Update {now}\n']
        for p in patterns:
            lines.append(f'- **{p.pattern_type}**: `{p.value}` - {p.occurrences} occurrences, confidence {p.confidence}%')
            for ev in p.evidence:
                lines.append(f'  - {ev}')
        lines.append('')
        try:
            with self._kb_path.open('a', encoding='utf-8') as f:
                f.write('\n'.join(lines))
        except Exception as e:
            logger.error('Failed to write knowledge base: %s', e)
            raise

    def _update_pattern_library(self, patterns: list[PatternRecord]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        lines = [f'\n## Patterns detected {now}\n']
        for p in patterns:
            lines.append(f'### {p.pattern_type}: {p.value}')
            lines.append(f'- Occurrences: {p.occurrences}')
            lines.append(f'- Confidence: {p.confidence}%')
            lines.append(f'- First seen: {p.first_seen}')
            lines.append(f'- Last seen: {p.last_seen}')
            lines.append('')
        try:
            with self._pl_path.open('a', encoding='utf-8') as f:
                f.write('\n'.join(lines))
        except Exception as e:
            logger.error('Failed to write pattern library: %s', e)
            raise

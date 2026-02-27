from __future__ import annotations
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path


logger = logging.getLogger(__name__)


@dataclass
class SkillStats:
    trigger_count: int = 0


@dataclass
class HealthReport:
    total_sessions: int
    skill_stats: dict[str, SkillStats]
    zombie_skills: list[str] = field(default_factory=list)
    generated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SelfEvaluator:
    def __init__(self, repo_path: Path, zombie_threshold: int = 10):
        self.repo_path = repo_path
        self.zombie_threshold = zombie_threshold

    def _load_events(self) -> list[dict]:
        events_dir = self.repo_path / 'events'
        if not events_dir.exists():
            return []
        events = []
        for f in events_dir.glob('*.json'):
            try:
                events.append(json.loads(f.read_text(encoding='utf-8')))
            except (json.JSONDecodeError, OSError) as e:
                logger.warning('Skipping malformed event file %s: %s', f.name, e)
        return events

    def generate_report(self) -> HealthReport:
        events = self._load_events()
        skill_stats: dict[str, SkillStats] = {}

        for evt in events:
            for skill in evt.get('skillsTriggered', []):
                if skill not in skill_stats:
                    skill_stats[skill] = SkillStats()
                skill_stats[skill].trigger_count += 1

        total_sessions = len({evt.get('sessionId') for evt in events if evt.get('sessionId')})

        # Detect zombie skills: triggered in <10% of sessions AND total_sessions >= threshold
        zombie_skills: list[str] = []
        if total_sessions >= self.zombie_threshold:
            for skill, stats in skill_stats.items():
                if stats.trigger_count / total_sessions < 0.1:
                    zombie_skills.append(skill)

        return HealthReport(
            total_sessions=total_sessions,
            skill_stats=skill_stats,
            zombie_skills=sorted(zombie_skills),
        )

    def format_report(self, report: HealthReport) -> str:
        lines = [
            '# nexus Health Report',
            '',
            f'Generated: {report.generated_at}',
            f'Total sessions: {report.total_sessions}',
            '',
            '## Skill Usage',
        ]
        if not report.skill_stats:
            lines.append('No skill usage recorded.')
        else:
            for skill, stats in sorted(report.skill_stats.items()):
                lines.append(f'- `{skill}`: {stats.trigger_count} triggers')
        if report.zombie_skills:
            lines += ['', '## Zombie Skills (never triggered)', '']
            for z in report.zombie_skills:
                lines.append(f'- `{z}`')
        return '\n'.join(lines)

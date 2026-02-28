from __future__ import annotations
import json
import logging
import math
from collections import Counter
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


@dataclass
class DimensionScore:
    name: str
    score: float  # 0.0 ~ 1.0
    details: dict = field(default_factory=dict)


@dataclass
class EnhancedHealthReport:
    overall_score: float  # 0.0 ~ 1.0 加权总分
    dimension_scores: list[DimensionScore]
    total_sessions: int
    total_events: int
    zombie_skills: list[str] = field(default_factory=list)
    generated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


DIMENSION_WEIGHTS = {
    'skill_health': 0.20,
    'tool_health': 0.15,
    'mode_health': 0.15,
    'error_health': 0.20,
    'agent_health': 0.15,
    'evolution_health': 0.15,
}


class SelfEvaluator:
    def __init__(self, repo_path: Path | None = None, *,
                 events: list[dict] | None = None,
                 zombie_threshold: int = 10):
        self.repo_path = repo_path
        self.zombie_threshold = zombie_threshold
        self._injected_events = events

    def _load_events(self) -> list[dict]:
        if self._injected_events is not None:
            return self._injected_events
        if self.repo_path is None:
            return []
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

    def _detect_zombies(self, events: list[dict], total_sessions: int) -> list[str]:
        skill_counts: dict[str, int] = {}
        for evt in events:
            for skill in evt.get('skillsTriggered', []):
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
        zombie_skills = []
        if total_sessions >= self.zombie_threshold:
            for skill, count in skill_counts.items():
                if count / total_sessions < 0.1:
                    zombie_skills.append(skill)
        return sorted(zombie_skills)

    def generate_report(self) -> HealthReport:
        events = self._load_events()
        skill_stats: dict[str, SkillStats] = {}

        for evt in events:
            for skill in evt.get('skillsTriggered', []):
                if skill not in skill_stats:
                    skill_stats[skill] = SkillStats()
                skill_stats[skill].trigger_count += 1

        total_sessions = len({evt.get('sessionId') for evt in events if evt.get('sessionId')})
        zombie_skills = self._detect_zombies(events, total_sessions)

        return HealthReport(
            total_sessions=total_sessions,
            skill_stats=skill_stats,
            zombie_skills=zombie_skills,
        )

    def generate_health_report(self) -> EnhancedHealthReport:
        events = self._load_events()
        if not events:
            empty_dims = [
                DimensionScore(name=name, score=0.0)
                for name in DIMENSION_WEIGHTS
            ]
            return EnhancedHealthReport(
                overall_score=0.0,
                dimension_scores=empty_dims,
                total_sessions=0,
                total_events=0,
            )
        dimensions = [
            self._eval_skill_health(events),
            self._eval_tool_health(events),
            self._eval_mode_health(events),
            self._eval_error_health(events),
            self._eval_agent_health(events),
            self._eval_evolution_health(events),
        ]
        overall = sum(
            d.score * DIMENSION_WEIGHTS.get(d.name, 0)
            for d in dimensions
        )
        total_sessions = len({e.get('sessionId') for e in events if e.get('sessionId')})
        zombie_skills = self._detect_zombies(events, total_sessions)
        return EnhancedHealthReport(
            overall_score=round(overall, 3),
            dimension_scores=dimensions,
            total_sessions=total_sessions,
            total_events=len(events),
            zombie_skills=zombie_skills,
        )

    def _eval_skill_health(self, events: list[dict]) -> DimensionScore:
        all_skills: list[str] = []
        for e in events:
            all_skills.extend(e.get('skillsTriggered', []))
        unique = len(set(all_skills))
        total = len(all_skills)
        if total == 0:
            return DimensionScore(name='skill_health', score=0.0, details={'unique': 0, 'total': 0})
        diversity = min(1.0, unique / max(1, total * 0.3))
        return DimensionScore(name='skill_health', score=round(diversity, 3),
                              details={'unique': unique, 'total': total})

    def _eval_tool_health(self, events: list[dict]) -> DimensionScore:
        total_calls = 0
        failed_calls = 0
        for e in events:
            tools = e.get('toolCalls', [])
            if isinstance(tools, list):
                total_calls += len(tools)
                for t in tools:
                    if isinstance(t, dict) and t.get('error'):
                        failed_calls += 1
        if total_calls == 0:
            return DimensionScore(name='tool_health', score=1.0, details={'total': 0, 'failed': 0})
        success_rate = 1.0 - (failed_calls / total_calls)
        return DimensionScore(name='tool_health', score=round(success_rate, 3),
                              details={'total': total_calls, 'failed': failed_calls})

    def _eval_mode_health(self, events: list[dict]) -> DimensionScore:
        mode_counter: Counter[str] = Counter()
        for e in events:
            for m in e.get('modesUsed', []):
                mode_counter[m] += 1
        if not mode_counter:
            return DimensionScore(name='mode_health', score=0.0, details={'modes': {}})
        total = sum(mode_counter.values())
        n = len(mode_counter)
        if n <= 1:
            return DimensionScore(name='mode_health', score=0.5, details={'modes': dict(mode_counter)})
        entropy = -sum((c / total) * math.log2(c / total) for c in mode_counter.values())
        max_entropy = math.log2(n)
        score = entropy / max_entropy if max_entropy > 0 else 0
        return DimensionScore(name='mode_health', score=round(score, 3),
                              details={'modes': dict(mode_counter)})

    def _eval_error_health(self, events: list[dict]) -> DimensionScore:
        total_events = len(events)
        error_events = sum(1 for e in events if e.get('errors'))
        if total_events == 0:
            return DimensionScore(name='error_health', score=1.0, details={'total': 0, 'with_errors': 0})
        error_rate = error_events / total_events
        score = max(0.0, 1.0 - error_rate * 2)
        return DimensionScore(name='error_health', score=round(score, 3),
                              details={'total': total_events, 'with_errors': error_events})

    def _eval_agent_health(self, events: list[dict]) -> DimensionScore:
        total_spawned = 0
        total_completed = 0
        for e in events:
            spawned = e.get('agentsSpawned', 0)
            completed = e.get('agentsCompleted', 0)
            if isinstance(spawned, (int, float)):
                total_spawned += spawned
            if isinstance(completed, (int, float)):
                total_completed += completed
        if total_spawned == 0:
            return DimensionScore(name='agent_health', score=1.0,
                                  details={'spawned': 0, 'completed': 0})
        rate = total_completed / total_spawned
        return DimensionScore(name='agent_health', score=round(min(1.0, rate), 3),
                              details={'spawned': total_spawned, 'completed': total_completed})

    def _eval_evolution_health(self, events: list[dict]) -> DimensionScore:
        has_patterns = 0
        has_improvements = 0
        for e in events:
            if e.get('patternsDetected'):
                has_patterns += 1
            if e.get('improvementsApplied'):
                has_improvements += 1
        total = len(events)
        if total == 0:
            return DimensionScore(name='evolution_health', score=0.0,
                                  details={'with_patterns': 0, 'with_improvements': 0})
        activity = (has_patterns + has_improvements) / (total * 2)
        return DimensionScore(name='evolution_health', score=round(min(1.0, activity), 3),
                              details={'with_patterns': has_patterns, 'with_improvements': has_improvements})

    def format_health_report(self, report: EnhancedHealthReport) -> str:
        lines = [
            '# nexus Enhanced Health Report',
            '',
            f'Generated: {report.generated_at}',
            f'Overall Score: {report.overall_score:.1%}',
            f'Total sessions: {report.total_sessions}',
            f'Total events: {report.total_events}',
            '',
            '## Dimension Scores',
            '',
        ]
        for d in report.dimension_scores:
            bar = '█' * int(d.score * 10) + '░' * (10 - int(d.score * 10))
            lines.append(f'- **{d.name}**: {d.score:.1%} {bar}')
        if report.zombie_skills:
            lines += ['', '## Zombie Skills', '']
            for z in report.zombie_skills:
                lines.append(f'- `{z}`')
        return '\n'.join(lines)

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
            lines += ['', '## Zombie Skills (triggered in <10% of sessions)', '']
            for z in report.zombie_skills:
                lines.append(f'- `{z}`')
        return '\n'.join(lines)

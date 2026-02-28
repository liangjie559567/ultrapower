# nexus-daemon/reflexion.py
from __future__ import annotations
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class ReflectionEntry:
    round_num: int
    timestamp: str
    observation: str
    evaluation: str
    reflection: str
    action_items: list[str]
    score: float  # 0.0-1.0 self-evaluation score

    def to_dict(self) -> dict:
        return {
            'round_num': self.round_num,
            'timestamp': self.timestamp,
            'observation': self.observation,
            'evaluation': self.evaluation,
            'reflection': self.reflection,
            'action_items': self.action_items,
            'score': self.score,
        }

    @classmethod
    def from_dict(cls, data: dict) -> ReflectionEntry:
        return cls(
            round_num=data['round_num'],
            timestamp=data['timestamp'],
            observation=data['observation'],
            evaluation=data['evaluation'],
            reflection=data['reflection'],
            action_items=data['action_items'],
            score=data['score'],
        )


class ReflectionMemory:
    """Stores and retrieves past reflections for learning."""

    def __init__(self, max_entries: int = 50):
        self._entries: list[ReflectionEntry] = []
        self._max_entries = max_entries
        self._completed_actions: set[str] = set()

    def add(self, entry: ReflectionEntry) -> None:
        self._entries.append(entry)
        if len(self._entries) > self._max_entries:
            self._entries = self._entries[-self._max_entries:]

    def get_recent(self, n: int = 5) -> list[ReflectionEntry]:
        return self._entries[-n:]

    def get_by_score_range(self, min_score: float, max_score: float) -> list[ReflectionEntry]:
        return [e for e in self._entries if min_score <= e.score <= max_score]

    def get_action_items(self, pending_only: bool = True) -> list[str]:
        all_items: list[str] = []
        for entry in self._entries:
            for item in entry.action_items:
                if pending_only and item in self._completed_actions:
                    continue
                if item not in all_items:
                    all_items.append(item)
        return all_items

    def complete_action(self, action: str) -> None:
        self._completed_actions.add(action)

    def average_score(self) -> float:
        if not self._entries:
            return 0.0
        return sum(e.score for e in self._entries) / len(self._entries)

    def to_dict(self) -> dict:
        return {
            'max_entries': self._max_entries,
            'entries': [e.to_dict() for e in self._entries],
            'completed_actions': sorted(self._completed_actions),
        }

    @classmethod
    def from_dict(cls, data: dict) -> ReflectionMemory:
        mem = cls(max_entries=data.get('max_entries', 50))
        for entry_data in data.get('entries', []):
            mem._entries.append(ReflectionEntry.from_dict(entry_data))
        mem._completed_actions = set(data.get('completed_actions', []))
        return mem


class ReflexionEngine:
    """Implements the Reflexion evaluate-reflect-improve loop."""

    def __init__(self, memory: ReflectionMemory | None = None):
        self._memory = memory or ReflectionMemory()
        self._round_counter = 0

    @property
    def memory(self) -> ReflectionMemory:
        return self._memory

    def _compute_error_rate(self, events: list[dict]) -> float:
        if not events:
            return 0.0
        error_count = sum(1 for e in events if e.get('errors'))
        return error_count / len(events)

    def _compute_agent_completion_rate(self, events: list[dict]) -> float:
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
            return 1.0
        return min(1.0, total_completed / total_spawned)

    def _compute_tool_success_rate(self, events: list[dict]) -> float:
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
            return 1.0
        return 1.0 - (failed_calls / total_calls)

    def _compute_trend_score(self) -> float:
        """Compare recent scores to detect improvement or decline."""
        recent = self._memory.get_recent(3)
        if len(recent) < 2:
            return 0.5  # neutral when insufficient history
        scores = [e.score for e in recent]
        # Simple trend: compare last score to first in window
        delta = scores[-1] - scores[0]
        # Map delta [-1, 1] to [0, 1]
        return max(0.0, min(1.0, 0.5 + delta))

    def evaluate(self, events: list[dict], health_score: float) -> str:
        """Generate evaluation text from events and health score."""
        error_rate = self._compute_error_rate(events)
        agent_rate = self._compute_agent_completion_rate(events)
        tool_rate = self._compute_tool_success_rate(events)
        trend = self._compute_trend_score()

        # Weighted score: error_rate(0.3), agent_completion(0.3), tool_success(0.2), trend(0.2)
        score = (
            (1.0 - error_rate) * 0.3
            + agent_rate * 0.3
            + tool_rate * 0.2
            + trend * 0.2
        )
        self._last_score = round(max(0.0, min(1.0, score)), 3)

        lines = [
            f'Evaluation (score: {self._last_score:.3f}):',
            f'  Error rate: {error_rate:.1%} (weight 0.3)',
            f'  Agent completion rate: {agent_rate:.1%} (weight 0.3)',
            f'  Tool success rate: {tool_rate:.1%} (weight 0.2)',
            f'  Trend score: {trend:.3f} (weight 0.2)',
            f'  Health score input: {health_score:.3f}',
        ]
        return '\n'.join(lines)

    def reflect(self, observation: str, evaluation: str) -> tuple[str, list[str]]:
        """Generate reflection text and action items."""
        action_items: list[str] = []
        insights: list[str] = []

        # Parse score from evaluation
        score = getattr(self, '_last_score', 0.5)

        # Gather past action items to avoid duplicates
        past_actions = set()
        for entry in self._memory.get_recent(10):
            past_actions.update(entry.action_items)

        # Error-rate based insights
        if 'Error rate: ' in evaluation:
            rate_str = evaluation.split('Error rate: ')[1].split('%')[0]
            try:
                error_pct = float(rate_str) / 100
            except ValueError:
                error_pct = 0.0
            if error_pct > 0.3:
                insights.append('High error rate detected — errors are impacting overall health.')
                item = 'Investigate recurring errors and identify root causes'
                if item not in past_actions:
                    action_items.append(item)

        # Agent completion based insights
        if 'Agent completion rate: ' in evaluation:
            rate_str = evaluation.split('Agent completion rate: ')[1].split('%')[0]
            try:
                agent_pct = float(rate_str) / 100
            except ValueError:
                agent_pct = 1.0
            if agent_pct < 0.8:
                insights.append('Agent completion rate is below threshold — some agents are failing or timing out.')
                item = 'Review agent configurations and timeout settings'
                if item not in past_actions:
                    action_items.append(item)

        # Trend-based insights
        recent = self._memory.get_recent(3)
        if len(recent) >= 3:
            recent_scores = [e.score for e in recent]
            if all(recent_scores[i] > recent_scores[i + 1] for i in range(len(recent_scores) - 1)):
                insights.append('Score has been declining over the last 3 reflections — performance is degrading.')
                item = 'Flag declining performance trend for investigation'
                if item not in past_actions:
                    action_items.append(item)

        # Tool failure insights
        if 'Tool success rate: ' in evaluation:
            rate_str = evaluation.split('Tool success rate: ')[1].split('%')[0]
            try:
                tool_pct = float(rate_str) / 100
            except ValueError:
                tool_pct = 1.0
            if tool_pct < 0.9:
                insights.append('Tool failure rate is elevated — some tools are returning errors.')
                item = 'Audit tool configurations and error logs'
                if item not in past_actions:
                    action_items.append(item)

        if not insights:
            insights.append('System is operating within normal parameters.')

        reflection = ' '.join(insights)
        return reflection, action_items

    def run_cycle(self, events: list[dict], health_score: float) -> ReflectionEntry:
        """Full Reflexion cycle: observe -> evaluate -> reflect -> record."""
        self._round_counter += 1
        ts = datetime.now(timezone.utc).isoformat()

        # 1. Build observation
        total_events = len(events)
        error_count = sum(1 for e in events if e.get('errors'))
        total_spawned = sum(
            e.get('agentsSpawned', 0) for e in events
            if isinstance(e.get('agentsSpawned', 0), (int, float))
        )
        total_completed = sum(
            e.get('agentsCompleted', 0) for e in events
            if isinstance(e.get('agentsCompleted', 0), (int, float))
        )
        skills_triggered = set()
        for e in events:
            for s in e.get('skillsTriggered', []):
                skills_triggered.add(s)

        observation = (
            f'Round {self._round_counter}: '
            f'{total_events} events, {error_count} errors, '
            f'{total_spawned} agents spawned / {total_completed} completed, '
            f'{len(skills_triggered)} unique skills triggered'
        )

        # 2. Evaluate
        evaluation = self.evaluate(events, health_score)

        # 3. Reflect
        reflection, action_items = self.reflect(observation, evaluation)

        # 4. Create entry
        score = getattr(self, '_last_score', 0.5)
        entry = ReflectionEntry(
            round_num=self._round_counter,
            timestamp=ts,
            observation=observation,
            evaluation=evaluation,
            reflection=reflection,
            action_items=action_items,
            score=score,
        )

        # 5. Add to memory
        self._memory.add(entry)

        return entry

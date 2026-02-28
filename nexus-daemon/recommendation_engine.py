"""
Recommendation Engine with Thompson Sampling for nexus-daemon.

Uses a multi-armed bandit approach to recommend optimal agent/skill combinations
based on historical usage patterns.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field


@dataclass
class ArmStats:
    """Stats for a single arm (agent/skill) in the bandit."""

    name: str
    alpha: float = 1.0  # success count + 1 (Beta prior)
    beta: float = 1.0   # failure count + 1 (Beta prior)
    total_pulls: int = 0

    @property
    def success_rate(self) -> float:
        total = self.alpha + self.beta - 2  # subtract priors
        if total <= 0:
            return 0.0
        return (self.alpha - 1) / total


@dataclass
class Recommendation:
    """A single recommendation with score and reasoning."""

    name: str
    score: float  # Thompson sample or computed score
    reason: str
    arm_stats: ArmStats | None = None


class RecommendationEngine:
    """Multi-armed bandit recommendation engine using Thompson Sampling."""

    def __init__(self) -> None:
        self._arms: dict[str, ArmStats] = {}

    def record_outcome(self, name: str, success: bool) -> None:
        """Record success/failure for an agent/skill."""
        if name not in self._arms:
            self._arms[name] = ArmStats(name=name)
        arm = self._arms[name]
        arm.total_pulls += 1
        if success:
            arm.alpha += 1
        else:
            arm.beta += 1

    def recommend(
        self,
        candidates: list[str] | None = None,
        n: int = 3,
    ) -> list[Recommendation]:
        """Recommend top-n agents/skills using Thompson Sampling.

        Args:
            candidates: Optional filter list. If None, uses all known arms.
            n: Number of recommendations to return.
        """
        arms: dict[str, ArmStats]
        if candidates is not None:
            arms = {}
            for c in candidates:
                if c in self._arms:
                    arms[c] = self._arms[c]
                else:
                    arms[c] = ArmStats(name=c)
        else:
            arms = self._arms

        if not arms:
            return []

        samples: list[Recommendation] = []
        for name, arm in arms.items():
            theta = random.betavariate(arm.alpha, arm.beta)
            reason = (
                f"Thompson sample={theta:.3f} "
                f"(α={arm.alpha:.0f}, β={arm.beta:.0f}, "
                f"rate={arm.success_rate:.1%})"
            )
            samples.append(
                Recommendation(
                    name=name,
                    score=round(theta, 4),
                    reason=reason,
                    arm_stats=arm,
                )
            )

        samples.sort(key=lambda r: r.score, reverse=True)
        return samples[:n]

    def recommend_for_task(
        self,
        task_context: dict,
        n: int = 3,
    ) -> list[Recommendation]:
        """Recommend based on task context (skill/mode/error hints).

        Extracts relevant candidates from task context and recommends.
        """
        candidates: list[str] | None = None
        if "candidates" in task_context:
            candidates = task_context["candidates"]
        return self.recommend(candidates=candidates, n=n)

    def get_stats(self) -> dict[str, ArmStats]:
        """Return all arm statistics."""
        return dict(self._arms)

    def load_from_events(self, events: list[dict]) -> None:
        """Bootstrap arm stats from historical events.

        Looks for 'agentTypes' and 'agentsCompleted'/'agentsSpawned' to infer
        success. Also looks for 'skillsTriggered' with session-level success
        indicators.
        """
        for event in events:
            agents = event.get("agentTypes", [])
            spawned = event.get("agentsSpawned", 0)
            completed = event.get("agentsCompleted", 0)
            has_errors = bool(event.get("errors"))

            if isinstance(agents, list):
                for agent in agents:
                    if spawned > 0:
                        success = completed >= spawned and not has_errors
                    else:
                        success = not has_errors
                    self.record_outcome(agent, success)

            skills = event.get("skillsTriggered", [])
            if isinstance(skills, list):
                for skill in skills:
                    self.record_outcome(skill, not has_errors)

    def to_dict(self) -> dict:
        """Serialize state for persistence."""
        return {
            name: {
                "alpha": arm.alpha,
                "beta": arm.beta,
                "total_pulls": arm.total_pulls,
            }
            for name, arm in self._arms.items()
        }

    @classmethod
    def from_dict(cls, data: dict) -> "RecommendationEngine":
        """Restore from serialized state."""
        engine = cls()
        for name, stats in data.items():
            engine._arms[name] = ArmStats(
                name=name,
                alpha=stats.get("alpha", 1.0),
                beta=stats.get("beta", 1.0),
                total_pulls=stats.get("total_pulls", 0),
            )
        return engine

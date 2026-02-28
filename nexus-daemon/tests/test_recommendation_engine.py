import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from recommendation_engine import RecommendationEngine, ArmStats, Recommendation


class TestArmStats:
    def test_initial_success_rate_is_zero(self):
        arm = ArmStats(name="test")
        assert arm.success_rate == 0.0

    def test_success_rate_after_outcomes(self):
        arm = ArmStats(name="test", alpha=11.0, beta=1.0, total_pulls=10)
        # 10 successes, 0 failures -> rate = 10/10 = 1.0
        assert arm.success_rate == 1.0

    def test_mixed_success_rate(self):
        arm = ArmStats(name="test", alpha=4.0, beta=3.0, total_pulls=5)
        # 3 successes, 2 failures -> rate = 3/5 = 0.6
        assert abs(arm.success_rate - 0.6) < 0.01


class TestRecommendationEngine:
    def test_record_outcome_creates_arm(self):
        engine = RecommendationEngine()
        engine.record_outcome("executor", True)
        stats = engine.get_stats()
        assert "executor" in stats
        assert stats["executor"].alpha == 2.0  # 1 prior + 1 success
        assert stats["executor"].total_pulls == 1

    def test_record_multiple_outcomes(self):
        engine = RecommendationEngine()
        for _ in range(5):
            engine.record_outcome("executor", True)
        for _ in range(2):
            engine.record_outcome("executor", False)
        stats = engine.get_stats()
        assert stats["executor"].alpha == 6.0  # 1 + 5
        assert stats["executor"].beta == 3.0   # 1 + 2
        assert stats["executor"].total_pulls == 7

    def test_recommend_returns_sorted(self):
        engine = RecommendationEngine()
        for _ in range(20):
            engine.record_outcome("executor", True)
        for _ in range(20):
            engine.record_outcome("debugger", False)

        recs = engine.recommend(n=2)
        assert len(recs) == 2
        # scores must be in descending order
        assert recs[0].score >= recs[1].score

    def test_recommend_with_candidates_filter(self):
        engine = RecommendationEngine()
        engine.record_outcome("executor", True)
        engine.record_outcome("debugger", True)
        engine.record_outcome("planner", True)

        recs = engine.recommend(candidates=["executor", "debugger"], n=5)
        names = {r.name for r in recs}
        assert "planner" not in names
        assert len(recs) <= 2

    def test_recommend_unknown_candidates(self):
        engine = RecommendationEngine()
        recs = engine.recommend(candidates=["new_agent"], n=1)
        assert len(recs) == 1
        assert recs[0].name == "new_agent"

    def test_recommend_empty(self):
        engine = RecommendationEngine()
        recs = engine.recommend()
        assert recs == []

    def test_recommend_for_task(self):
        engine = RecommendationEngine()
        engine.record_outcome("executor", True)
        engine.record_outcome("debugger", True)

        recs = engine.recommend_for_task({"candidates": ["executor"]}, n=1)
        assert len(recs) == 1
        assert recs[0].name == "executor"

    def test_recommend_for_task_no_candidates(self):
        engine = RecommendationEngine()
        engine.record_outcome("executor", True)
        recs = engine.recommend_for_task({}, n=1)
        assert len(recs) == 1


class TestLoadFromEvents:
    def test_loads_agent_outcomes(self):
        events = [
            {
                "agentTypes": ["executor", "verifier"],
                "agentsSpawned": 2,
                "agentsCompleted": 2,
                "errors": [],
            },
            {
                "agentTypes": ["executor"],
                "agentsSpawned": 1,
                "agentsCompleted": 0,
                "errors": [{"type": "timeout"}],
            },
        ]
        engine = RecommendationEngine()
        engine.load_from_events(events)
        stats = engine.get_stats()
        assert "executor" in stats
        assert stats["executor"].total_pulls == 2

    def test_loads_skill_outcomes(self):
        events = [
            {"skillsTriggered": ["autopilot", "ralph"], "errors": []},
            {"skillsTriggered": ["autopilot"], "errors": [{"type": "crash"}]},
        ]
        engine = RecommendationEngine()
        engine.load_from_events(events)
        stats = engine.get_stats()
        assert "autopilot" in stats
        assert stats["autopilot"].total_pulls == 2

    def test_empty_events(self):
        engine = RecommendationEngine()
        engine.load_from_events([])
        assert engine.get_stats() == {}


class TestSerialization:
    def test_round_trip(self):
        engine = RecommendationEngine()
        engine.record_outcome("executor", True)
        engine.record_outcome("executor", True)
        engine.record_outcome("debugger", False)

        data = engine.to_dict()
        restored = RecommendationEngine.from_dict(data)

        assert restored.get_stats()["executor"].alpha == 3.0
        assert restored.get_stats()["debugger"].beta == 2.0

    def test_from_empty_dict(self):
        engine = RecommendationEngine.from_dict({})
        assert engine.get_stats() == {}

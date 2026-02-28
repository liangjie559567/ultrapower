import json
import sys
import pytest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from prompt_optimizer import PromptOptimizer, PromptVariant, OptimizationResult


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_variant(
    variant_id: str = "v1",
    agent_type: str = "executor",
    template: str = "Do the task.",
    parameters: dict | None = None,
    performance_score: float = 0.5,
    trial_count: int = 0,
    success_count: int = 0,
) -> PromptVariant:
    return PromptVariant(
        variant_id=variant_id,
        agent_type=agent_type,
        template=template,
        parameters=parameters if parameters is not None else {},
        performance_score=performance_score,
        trial_count=trial_count,
        success_count=success_count,
        created_at="2026-01-01T00:00:00+00:00",
    )


# ---------------------------------------------------------------------------
# PromptVariant tests
# ---------------------------------------------------------------------------

class TestPromptVariant:
    def test_success_rate_zero_trials(self):
        v = make_variant(trial_count=0, success_count=0)
        assert v.success_rate == 0.0

    def test_success_rate_calculation(self):
        v = make_variant(trial_count=10, success_count=7)
        assert abs(v.success_rate - 0.7) < 1e-9

    def test_success_rate_full(self):
        v = make_variant(trial_count=5, success_count=5)
        assert v.success_rate == 1.0

    def test_to_dict_from_dict_roundtrip(self):
        v = make_variant(
            variant_id="abc",
            agent_type="planner",
            template="Plan carefully.",
            parameters={"temperature": 0.7, "max_tokens": 512},
            performance_score=0.8,
            trial_count=20,
            success_count=15,
        )
        restored = PromptVariant.from_dict(v.to_dict())
        assert restored.variant_id == v.variant_id
        assert restored.agent_type == v.agent_type
        assert restored.template == v.template
        assert restored.parameters == v.parameters
        assert restored.performance_score == v.performance_score
        assert restored.trial_count == v.trial_count
        assert restored.success_count == v.success_count
        assert restored.created_at == v.created_at

    def test_from_dict_defaults(self):
        minimal = {
            "variant_id": "x",
            "agent_type": "executor",
            "template": "t",
        }
        v = PromptVariant.from_dict(minimal)
        assert v.parameters == {}
        assert v.performance_score == 0.5
        assert v.trial_count == 0
        assert v.success_count == 0


# ---------------------------------------------------------------------------
# PromptOptimizer core tests
# ---------------------------------------------------------------------------

class TestPromptOptimizerCore:
    def test_register_and_get_variants(self):
        opt = PromptOptimizer()
        v = make_variant("v1", "executor")
        opt.register_variant(v)
        variants = opt.get_variants("executor")
        assert len(variants) == 1
        assert variants[0].variant_id == "v1"

    def test_get_variants_unknown_type_returns_empty(self):
        opt = PromptOptimizer()
        assert opt.get_variants("nonexistent") == []

    def test_register_multiple_variants_same_type(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor"))
        opt.register_variant(make_variant("v2", "executor"))
        assert len(opt.get_variants("executor")) == 2

    def test_select_variant_thompson_sampling(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor", trial_count=10, success_count=8))
        result = opt.select_variant("executor", method="thompson_sampling")
        assert result is not None
        assert result.selection_method == "thompson_sampling"
        assert result.selected_variant.variant_id == "v1"

    def test_select_variant_epsilon_greedy(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor", trial_count=10, success_count=8))
        result = opt.select_variant("executor", method="epsilon_greedy")
        assert result is not None
        assert result.selection_method == "epsilon_greedy"

    def test_select_variant_ucb1(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor", trial_count=5, success_count=4))
        result = opt.select_variant("executor", method="ucb1")
        assert result is not None
        assert result.selection_method == "ucb1"

    def test_select_variant_no_variants_returns_none(self):
        opt = PromptOptimizer()
        result = opt.select_variant("executor")
        assert result is None

    def test_select_variant_unknown_method_raises(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor"))
        with pytest.raises(ValueError):
            opt.select_variant("executor", method="bad_method")

    def test_record_outcome_increments_trial_count(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor"))
        opt.record_outcome("v1", "executor", success=True)
        v = opt.get_variants("executor")[0]
        assert v.trial_count == 1
        assert v.success_count == 1

    def test_record_outcome_failure(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor"))
        opt.record_outcome("v1", "executor", success=False)
        v = opt.get_variants("executor")[0]
        assert v.trial_count == 1
        assert v.success_count == 0

    def test_record_outcome_unknown_variant_no_crash(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor"))
        # Should not raise
        opt.record_outcome("nonexistent", "executor", success=True)
        v = opt.get_variants("executor")[0]
        assert v.trial_count == 0

    def test_get_best_variant(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor", trial_count=10, success_count=3))
        opt.register_variant(make_variant("v2", "executor", trial_count=10, success_count=9))
        best = opt.get_best_variant("executor")
        assert best is not None
        assert best.variant_id == "v2"

    def test_get_best_variant_no_variants_returns_none(self):
        opt = PromptOptimizer()
        assert opt.get_best_variant("executor") is None

    def test_apply_reflection_feedback_low_score_decreases(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor", performance_score=0.5))
        adjustments = opt.apply_reflection_feedback("executor", 0.2, [])
        v = opt.get_variants("executor")[0]
        assert v.performance_score < 0.5
        assert len(adjustments) > 0

    def test_apply_reflection_feedback_high_score_increases(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor", performance_score=0.5, trial_count=5))
        adjustments = opt.apply_reflection_feedback("executor", 0.8, [])
        v = opt.get_variants("executor")[0]
        assert v.performance_score > 0.5
        assert len(adjustments) > 0

    def test_apply_reflection_feedback_mid_score_no_change(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor", performance_score=0.5))
        adjustments = opt.apply_reflection_feedback("executor", 0.5, [])
        v = opt.get_variants("executor")[0]
        assert v.performance_score == 0.5
        assert adjustments == []

    def test_apply_reflection_feedback_temperature_action(self):
        opt = PromptOptimizer()
        opt.register_variant(
            make_variant("v1", "executor", parameters={"temperature": 0.5}, performance_score=0.5)
        )
        adjustments = opt.apply_reflection_feedback(
            "executor", 0.5, ["Increase temperature for more creative output"]
        )
        v = opt.get_variants("executor")[0]
        assert v.parameters["temperature"] > 0.5
        assert any("temperature" in a.lower() for a in adjustments)

    def test_apply_reflection_feedback_timeout_action(self):
        opt = PromptOptimizer()
        opt.register_variant(
            make_variant("v1", "executor", parameters={"max_tokens": 1024}, performance_score=0.5)
        )
        adjustments = opt.apply_reflection_feedback(
            "executor", 0.5, ["Reduce timeout to speed up responses"]
        )
        v = opt.get_variants("executor")[0]
        assert v.parameters["max_tokens"] < 1024

    def test_serialization_roundtrip(self):
        opt = PromptOptimizer(epsilon=0.2)
        opt.register_variant(make_variant("v1", "executor", trial_count=5, success_count=3))
        opt.register_variant(make_variant("v2", "planner", trial_count=2, success_count=2))
        data = opt.to_dict()
        restored = PromptOptimizer.from_dict(data)
        assert restored._epsilon == 0.2
        assert len(restored.get_variants("executor")) == 1
        assert len(restored.get_variants("planner")) == 1
        assert restored.get_variants("executor")[0].trial_count == 5

    def test_save_load_file_roundtrip(self, tmp_path):
        opt = PromptOptimizer(epsilon=0.15)
        opt.register_variant(make_variant("v1", "executor", trial_count=10, success_count=7))
        path = tmp_path / "optimizer.json"
        opt.save(path)
        loaded = PromptOptimizer.load(path)
        assert loaded._epsilon == 0.15
        v = loaded.get_variants("executor")[0]
        assert v.trial_count == 10
        assert v.success_count == 7

    def test_multiple_agent_types_independent(self):
        opt = PromptOptimizer()
        opt.register_variant(make_variant("v1", "executor"))
        opt.register_variant(make_variant("v2", "planner"))
        opt.register_variant(make_variant("v3", "debugger"))
        assert len(opt.get_variants("executor")) == 1
        assert len(opt.get_variants("planner")) == 1
        assert len(opt.get_variants("debugger")) == 1
        assert opt.get_variants("verifier") == []


# ---------------------------------------------------------------------------
# Integration tests
# ---------------------------------------------------------------------------

class TestIntegration:
    def test_multi_round_select_feedback_loop(self):
        """多轮选择-反馈循环后，高成功率变体应被更频繁选中（Thompson Sampling）"""
        opt = PromptOptimizer(epsilon=0.0)
        opt.register_variant(make_variant("good", "executor"))
        opt.register_variant(make_variant("bad", "executor"))

        # 模拟 good 变体表现好，bad 变体表现差
        for _ in range(20):
            opt.record_outcome("good", "executor", success=True)
        for _ in range(20):
            opt.record_outcome("bad", "executor", success=False)

        # 运行多轮选择，good 应被选中更多次
        good_count = 0
        for _ in range(50):
            result = opt.select_variant("executor", method="thompson_sampling")
            assert result is not None
            if result.selected_variant.variant_id == "good":
                good_count += 1

        # good 变体应被选中超过一半
        assert good_count > 25

    def test_epsilon_greedy_does_explore(self):
        """epsilon_greedy 确实会探索（以 epsilon 概率选择非最优变体）"""
        opt = PromptOptimizer(epsilon=0.5)  # 高探索率
        opt.register_variant(make_variant("best", "executor", trial_count=100, success_count=99))
        opt.register_variant(make_variant("other", "executor", trial_count=100, success_count=1))

        exploration_count = 0
        for _ in range(200):
            result = opt.select_variant("executor", method="epsilon_greedy")
            assert result is not None
            if result.selected_variant.variant_id == "other":
                exploration_count += 1

        # 以 0.5 的探索率，other 应被选中约 50 次（允许较大误差）
        assert exploration_count > 10

    def test_ucb1_prefers_low_trial_count(self):
        """UCB1 偏好低试验次数的变体（探索未知）"""
        opt = PromptOptimizer()
        # v1 有很多试验，v2 没有试验
        opt.register_variant(make_variant("v1", "executor", trial_count=100, success_count=90))
        opt.register_variant(make_variant("v2", "executor", trial_count=0, success_count=0))

        result = opt.select_variant("executor", method="ucb1")
        assert result is not None
        # v2 未被试验，UCB1 应优先选它
        assert result.selected_variant.variant_id == "v2"

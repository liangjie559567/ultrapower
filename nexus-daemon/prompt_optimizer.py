from __future__ import annotations
import json
import logging
import math
import random
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class PromptVariant:
    """一个提示词变体"""

    variant_id: str
    agent_type: str          # 适用的 agent 类型
    template: str            # 提示词模板
    parameters: dict         # 可调参数（temperature、max_tokens 等）
    performance_score: float # 历史表现评分 0-1
    trial_count: int         # 被选中的次数
    success_count: int       # 成功次数
    created_at: str

    @property
    def success_rate(self) -> float:
        if self.trial_count == 0:
            return 0.0
        return self.success_count / self.trial_count

    def to_dict(self) -> dict:
        return {
            "variant_id": self.variant_id,
            "agent_type": self.agent_type,
            "template": self.template,
            "parameters": self.parameters,
            "performance_score": self.performance_score,
            "trial_count": self.trial_count,
            "success_count": self.success_count,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> PromptVariant:
        return cls(
            variant_id=data["variant_id"],
            agent_type=data["agent_type"],
            template=data["template"],
            parameters=data.get("parameters", {}),
            performance_score=data.get("performance_score", 0.5),
            trial_count=data.get("trial_count", 0),
            success_count=data.get("success_count", 0),
            created_at=data.get("created_at", ""),
        )


@dataclass
class OptimizationResult:
    """优化结果"""

    selected_variant: PromptVariant
    selection_method: str    # "thompson_sampling" | "epsilon_greedy" | "ucb1"
    exploration_score: float # 探索分数
    reason: str


class PromptOptimizer:
    """基于 RL 反馈的提示词优化器"""

    def __init__(self, epsilon: float = 0.1):
        self._variants: dict[str, list[PromptVariant]] = {}  # agent_type -> variants
        self._epsilon = epsilon  # epsilon-greedy 探索率

    def register_variant(self, variant: PromptVariant) -> None:
        """注册一个提示词变体"""
        if variant.agent_type not in self._variants:
            self._variants[variant.agent_type] = []
        self._variants[variant.agent_type].append(variant)

    def get_variants(self, agent_type: str) -> list[PromptVariant]:
        return list(self._variants.get(agent_type, []))

    def select_variant(
        self, agent_type: str, method: str = "thompson_sampling"
    ) -> OptimizationResult | None:
        """为指定 agent 类型选择最优变体"""
        variants = self._variants.get(agent_type, [])
        if not variants:
            return None

        if method == "thompson_sampling":
            variant, score = self._thompson_select(variants)
            reason = f"Thompson Sampling selected variant with sample={score:.4f}"
        elif method == "epsilon_greedy":
            variant, score = self._epsilon_greedy_select(variants)
            reason = f"Epsilon-Greedy selected variant (epsilon={self._epsilon:.2f})"
        elif method == "ucb1":
            variant, score = self._ucb1_select(variants)
            reason = f"UCB1 selected variant with score={score:.4f}"
        else:
            raise ValueError(f"Unknown selection method: {method}")

        return OptimizationResult(
            selected_variant=variant,
            selection_method=method,
            exploration_score=score,
            reason=reason,
        )

    def _thompson_select(self, variants: list[PromptVariant]) -> tuple[PromptVariant, float]:
        """Thompson Sampling: 对每个变体采样 theta ~ Beta(success+1, failure+1)"""
        best_variant = variants[0]
        best_sample = -1.0
        for v in variants:
            alpha = v.success_count + 1
            beta_param = (v.trial_count - v.success_count) + 1
            sample = random.betavariate(alpha, beta_param)
            if sample > best_sample:
                best_sample = sample
                best_variant = v
        return best_variant, best_sample

    def _epsilon_greedy_select(self, variants: list[PromptVariant]) -> tuple[PromptVariant, float]:
        """Epsilon-Greedy: 以 epsilon 概率随机探索，否则选最优"""
        if random.random() < self._epsilon:
            chosen = random.choice(variants)
            return chosen, chosen.success_rate
        best = max(variants, key=lambda v: v.success_rate)
        return best, best.success_rate

    def _ucb1_select(self, variants: list[PromptVariant]) -> tuple[PromptVariant, float]:
        """UCB1: success_rate + sqrt(2 * ln(total_trials) / trial_count)"""
        total_trials = sum(v.trial_count for v in variants)
        # 未被试验过的变体优先（UCB1 = infinity）
        untried = [v for v in variants if v.trial_count == 0]
        if untried:
            chosen = untried[0]
            return chosen, float("inf")
        log_total = math.log(max(total_trials, 1))
        best_variant = variants[0]
        best_score = -1.0
        for v in variants:
            ucb = v.success_rate + math.sqrt(2 * log_total / v.trial_count)
            if ucb > best_score:
                best_score = ucb
                best_variant = v
        return best_variant, best_score

    def record_outcome(self, variant_id: str, agent_type: str, success: bool) -> None:
        """记录变体的执行结果"""
        for v in self._variants.get(agent_type, []):
            if v.variant_id == variant_id:
                v.trial_count += 1
                if success:
                    v.success_count += 1
                return
        logger.warning("variant_id=%s not found for agent_type=%s", variant_id, agent_type)

    def get_best_variant(self, agent_type: str) -> PromptVariant | None:
        """返回成功率最高的变体"""
        variants = self._variants.get(agent_type, [])
        if not variants:
            return None
        return max(variants, key=lambda v: v.success_rate)

    def apply_reflection_feedback(
        self,
        agent_type: str,
        reflection_score: float,
        action_items: list[str],
    ) -> list[str]:
        """根据 Reflexion 反馈调整变体参数"""
        adjustments: list[str] = []
        variants = self._variants.get(agent_type, [])
        if not variants:
            return adjustments

        if reflection_score < 0.3:
            for v in variants:
                v.performance_score = max(0.0, v.performance_score - 0.1)
                adjustments.append(
                    f"Decreased performance_score for variant {v.variant_id} to {v.performance_score:.2f}"
                )
        elif reflection_score > 0.7:
            # 提升最近使用（trial_count 最高）的变体
            best = max(variants, key=lambda v: v.trial_count)
            best.performance_score = min(1.0, best.performance_score + 0.1)
            adjustments.append(
                f"Increased performance_score for variant {best.variant_id} to {best.performance_score:.2f}"
            )

        # 根据 action_items 关键词调整参数
        for item in action_items:
            item_lower = item.lower()
            if "temperature" in item_lower or "creative" in item_lower:
                for v in variants:
                    if "temperature" in v.parameters:
                        old = v.parameters["temperature"]
                        v.parameters["temperature"] = min(1.0, old + 0.05)
                        adjustments.append(
                            f"Adjusted temperature for variant {v.variant_id}: {old:.2f} -> {v.parameters['temperature']:.2f}"
                        )
            if "timeout" in item_lower or "slow" in item_lower:
                for v in variants:
                    if "max_tokens" in v.parameters:
                        old = v.parameters["max_tokens"]
                        v.parameters["max_tokens"] = max(256, old - 128)
                        adjustments.append(
                            f"Reduced max_tokens for variant {v.variant_id}: {old} -> {v.parameters['max_tokens']}"
                        )

        return adjustments

    def to_dict(self) -> dict:
        return {
            "epsilon": self._epsilon,
            "variants": {
                agent_type: [v.to_dict() for v in vs]
                for agent_type, vs in self._variants.items()
            },
        }

    @classmethod
    def from_dict(cls, data: dict) -> PromptOptimizer:
        optimizer = cls(epsilon=data.get("epsilon", 0.1))
        for agent_type, variant_list in data.get("variants", {}).items():
            for vd in variant_list:
                optimizer.register_variant(PromptVariant.from_dict(vd))
        return optimizer

    def save(self, path: Path) -> None:
        path.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")

    @classmethod
    def load(cls, path: Path) -> PromptOptimizer:
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls.from_dict(data)

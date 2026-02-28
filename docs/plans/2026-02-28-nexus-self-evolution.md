# Nexus Self-Evolution System Enhancement Plan (v2 — Post-Review)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 nexus-daemon 从单维模式检测升级为多维智能自进化系统，覆盖模式挖掘、健康评估、异常检测、推荐引擎、LLM 自反思和知识图谱。

**Architecture:** 分 4 个优先级阶段（P0→P1→P2→P3）递进实现。P0 为纯 Python 数据分析层（无 LLM 依赖），构建数据基础；P1 引入 LLM 和语义能力；P2 增加安全沙箱和强化学习；P3 为长期愿景。

**Tech Stack:** Python 3.11+, pytest, aiohttp, collections.Counter, dataclasses, math, json, pathlib

**Review History:**
- v1: 初始计划 (T1-T12)
- v2: 经 Architect + Critic 两轮评审，融合 6 项强制修正

---

## Review Consensus (Architect + Critic)

### 6 项强制修正

1. **T2 向后兼容接口**: SelfEvaluator 必须同时支持 `repo_path: Path` 和 `events: list[dict]` 两种初始化方式，不破坏 daemon.py 现有调用
2. **T4 Strategy 模式**: 异常检测必须使用 CompositeDetector + 可插拔检测器接口，P0 仅实现 ZScoreDetector
3. **T6 God Class 重构**: daemon.py NexusDaemon 拆分为 GitSync、EventProcessor、ImprovementManager、HealthReporter、ModuleRegistry 五个职责类
4. **T6 用户可见输出**: P0 必须产出 `consciousness/status.md` 最小状态摘要
5. **T6 渐进式 Schema**: 事件验证采用渐进式（warn-only），不作为独立阻塞任务
6. **T17 重定义**: 不删除，重定义为"跨 Agent 经验传播"，移至 P1

---

## Task Queue

### P0 — 数据基础层（纯 Python，无 LLM 依赖）

| ID | Name | Dependencies | Parallel Group | Estimated |
|----|------|-------------|----------------|-----------|
| T1 | Multi-dim pattern detection (evolution_engine.py) | none | G1 | 2-3h |
| T2 | 6-dim health evaluation (self_evaluator.py) | none | G1 | 3h |
| T4 | Anomaly detection — Strategy pattern (anomaly_detector.py) | T2 | G2 | 2h |
| T5 | Recommendation engine + Thompson Sampling (recommendation_engine.py) | T2, T4 | G3 | 3h |
| T6 | Daemon integration + God Class refactor + status output | T1, T2, T4, T5 | G4 | 3h |

### P1 — LLM + 语义能力

| ID | Name | Dependencies | Parallel Group | Estimated |
|----|------|-------------|----------------|-----------|
| T7 | LLM self-reflection Reflexion framework (consciousness_loop.py) | T6 | G5 | 3-4h |
| T8 | Knowledge graph — chromadb + networkx (knowledge_graph.py) | T6 | G5 | 4-5h |
| T17 | Cross-agent experience propagation (experience_sharing.py) | T8 | G5 | 2-3h |

### P2 — 安全沙箱 + 强化学习

| ID | Name | Dependencies | Parallel Group | Estimated |
|----|------|-------------|----------------|-----------|
| T9 | Sandbox + canary release (self_modifier.py) | T6 | G6 | 3-4h |
| T15 | Code health scorer — radon MI + complexity (code_health_scorer.py) | T2 | G6 | 2h |
| T14 | Bottleneck analyzer (bottleneck_analyzer.py) | T6 | G6 | 2h |

### P3 — 集成 + 可视化

| ID | Name | Dependencies | Parallel Group | Estimated |
|----|------|-------------|----------------|-----------|
| T10 | RL feedback loop (prompt_optimizer.py) | T7, T9 | G7 | 3-4h |
| T11 | 4-layer memory model (memory_model.py) | T8 | G7 | 3-4h |
| T12 | Final integration + CI Gate | T1-T11 | G8 | 1h |
| T18 | Evolution dashboard (evolution_dashboard.py) | T14 | G8 | 2h |

---

## P0 Task Details

### Task 1: Multi-dimensional Pattern Detection (evolution_engine.py)

**Files:**
- Modify: `nexus-daemon/evolution_engine.py`
- Test: `nexus-daemon/tests/test_evolution_engine.py`

**Context:** 当前 `detect_patterns()` 只检测 `mode_usage` 一个维度。扩展为 5 个维度：mode_usage、tool_sequence、agent_cooccurrence、error_pattern、skill_chain。

**Implementation:** 保留现有 `mode_usage` 逻辑，追加 `_detect_tool_sequences()`、`_detect_agent_cooccurrence()`、`_detect_error_patterns()` 三个私有函数，在 `detect_patterns()` 末尾调用。使用滑动窗口 n-gram 提取 tool sequence，使用 `itertools.combinations` 提取 agent 共现对。

---

### Task 2: Six-Dimension Health Evaluation (self_evaluator.py)

**Files:**
- Modify: `nexus-daemon/self_evaluator.py`
- Test: `nexus-daemon/tests/test_self_evaluator.py`

**Context:** 当前 `SelfEvaluator` 只做 skill 触发计数和僵尸检测。扩展为 6 维健康评估。

**强制约束 — 向后兼容接口:**
```python
class SelfEvaluator:
    def __init__(self, repo_path: Path | None = None, *,
                 events: list[dict] | None = None,
                 zombie_threshold: int = 10):
        # 支持两种模式：
        # 1. repo_path 模式（daemon.py 现有调用）
        # 2. events 模式（新的直接传入事件）
```

保留 `generate_report()` 方法不变（向后兼容），新增 `generate_health_report()` 返回含 `dimension_scores` 的增强报告。

---

### Task 4: Anomaly Detection — Strategy Pattern (anomaly_detector.py)

**Files:**
- Create: `nexus-daemon/anomaly_detector.py`
- Test: `nexus-daemon/tests/test_anomaly_detector.py`

**强制约束 — Strategy 模式接口:**
```python
class AnomalyDetector(ABC):
    @abstractmethod
    def detect(self, values: list[float]) -> list[AnomalyRecord]: ...

class ZScoreDetector(AnomalyDetector): ...  # P0 唯一实现
class CompositeDetector(AnomalyDetector):   # 组合多个检测器
    def __init__(self, detectors: list[AnomalyDetector]): ...
```

P0 仅实现 ZScoreDetector。IQR 和 EWMA 留给后续迭代。

---

### Task 5: Recommendation Engine + Thompson Sampling (recommendation_engine.py)

**Files:**
- Create: `nexus-daemon/recommendation_engine.py`
- Test: `nexus-daemon/tests/test_recommendation_engine.py`

**Context:** 基于使用模式推荐最优 agent/skill 组合。合并原 T5 和 T16，使用 Thompson Sampling (`θ ~ Beta(α_success, β_failure)`) 实现探索-利用平衡。

---

### Task 6: Daemon Integration + God Class Refactor + Status Output

**Files:**
- Modify: `nexus-daemon/daemon.py`
- Create: `nexus-daemon/module_registry.py`
- Test: `nexus-daemon/tests/test_daemon.py`

**强制约束:**
1. **God Class 拆分**: NexusDaemon 拆为 GitSync、EventProcessor、ImprovementManager、HealthReporter + ModuleRegistry 协调
2. **渐进式 Schema**: 事件加载时 warn-only 验证，不阻塞处理
3. **状态输出**: 每次 run_once 后写入 `consciousness/status.md`
4. **Circuit Breaker**: 模块连续失败 3 次后熔断，不影响其他模块

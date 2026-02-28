# nexus-daemon

ultrapower 多维智能自进化系统。VPS 守护进程，每分钟 git pull 拉取会话事件，运行 15 个子系统的完整进化管线，生成改进建议。

## 架构概览

```
NexusIntegrator (编排器)
  ├─ 1. EvolutionEngine      — 模式检测与知识收割
  ├─ 2. SelfEvaluator        — 多维健康评估
  ├─ 3. AnomalyDetector      — Z-score/IQR 异常检测
  ├─ 4. RecommendationEngine — 协同过滤推荐
  ├─ 5. BottleneckAnalyzer   — 性能瓶颈分析
  ├─ 6. ReflexionEngine      — 自我反思循环
  ├─ 7. KnowledgeGraph       — 知识图谱构建
  ├─ 8. EvolutionDashboard   — 综合仪表盘
  ├─ ExperiencePropagator    — 跨会话经验传播
  ├─ PromptOptimizer         — 提示词优化
  ├─ MemoryModel             — 记忆衰减模型
  ├─ CodeHealthScorer        — 代码健康评分
  ├─ ModuleRegistry          — 模块注册与发现
  ├─ SelfModifier            — 自我修改器
  └─ ConsciousnessLoop       — 意识循环
```

## 运行

```bash
pip install -r requirements.txt
NEXUS_REPO_PATH=/path/to/nexus-daemon python daemon.py
```

## 测试

```bash
python -m pytest tests/ -v          # 375 tests
python -m pytest tests/ -q          # 简洁输出
python ci_gate.py                   # CI 四门验证
```

## 数据流：TS → Python

### 概览

```
Claude Code (TS)                    nexus-daemon (Python, VPS)
─────────────────                   ──────────────────────────
PostToolUse hook                    git pull (每 60s)
  │                                   │
  ▼                                   ▼
usage-tracker.ts                    daemon.py → NexusIntegrator.run_cycle()
  recordUsage()                       │
  → .omc/axiom/evolution/             ├─ 1. EvolutionEngine (模式检测)
    usage_metrics.json                ├─ 2. SelfEvaluator (健康评估)
                                      ├─ 3. AnomalyDetector (异常检测)
session-end hook                      ├─ 4. RecommendationEngine (推荐)
  handleNexusSessionEnd()             ├─ 5. BottleneckAnalyzer (瓶颈分析)
  collectSessionEvent()               ├─ 6. ReflexionEngine (自我反思)
  → .omc/nexus/events/               ├─ 7. KnowledgeGraph (知识图谱)
    {sessionId}-{ts}.json             ├─ 8. EvolutionDashboard (仪表盘)
                                      │
  git push (session end)              └─ IntegrationResult → JSON 持久化
```

### 详细步骤

#### 1. TS 侧：事件收集

```
bridge.ts PostToolUse → usage-tracker.ts recordUsage()
  → .omc/axiom/evolution/usage_metrics.json

session-end hook → collectSessionEvent()
  → .omc/nexus/events/{sessionId}-{timestamp}.json
  → git push
```

#### 2. Python 侧：NexusIntegrator 管线

`daemon.py` 每 60 秒调用 `NexusIntegrator.run_cycle(events)`：

```
run_cycle(events)
  1. EvolutionEngine.detect_patterns()     → 模式列表
  2. SelfEvaluator.generate_health_report() → 健康分数
  3. AnomalyDetector.detect_anomalies()     → 异常列表
  4. RecommendationEngine.recommend()       → 推荐列表
  5. BottleneckAnalyzer.analyze()           → 瓶颈报告
  6. ReflexionEngine.run_cycle()            → 反思分数
  7. KnowledgeGraph.build_from_events()     → 节点/边统计
  8. EvolutionDashboard.generate()          → 仪表盘报告
  → IntegrationResult (JSON 持久化)
```

每个步骤独立捕获异常（故障隔离），单个子系统失败不阻塞其他步骤。

#### 3. 安全边界

| 组件 | 限制 |
|------|------|
| SelfModifier | 只能修改 `skills/*.md` 和 `agents/*.md` |
| SelfModifier | confidence < 70 的改进自动跳过 |
| SelfModifier | 路径遍历检测（resolve + relative_to） |
| EvolutionEngine | 只追加写入，不覆盖现有内容 |
| daemon | git rebase（非 merge），保持历史线性 |

## 子系统一览（15 个）

| 模块 | 类 | 功能 |
|------|-----|------|
| `evolution_engine.py` | `EvolutionEngine` | 模式检测、知识收割 |
| `self_evaluator.py` | `SelfEvaluator` | 多维健康评估（5 维度） |
| `anomaly_detector.py` | `AnomalyDetector` | Z-score/IQR 异常检测 |
| `recommendation_engine.py` | `RecommendationEngine` | 协同过滤推荐 |
| `bottleneck_analyzer.py` | `BottleneckAnalyzer` | 失败率/错误率/资源瓶颈 |
| `reflexion.py` | `ReflexionEngine` | 自我反思循环 |
| `knowledge_graph.py` | `KnowledgeGraph` | 知识图谱构建与查询 |
| `experience_sharing.py` | `ExperiencePropagator` | 跨会话经验传播 |
| `prompt_optimizer.py` | `PromptOptimizer` | 提示词优化 |
| `memory_model.py` | `MemoryModel` | 记忆衰减模型 |
| `code_health_scorer.py` | `CodeHealthScorer` | 代码可维护性评分 |
| `evolution_dashboard.py` | `EvolutionDashboard` | 综合仪表盘（8 区域） |
| `module_registry.py` | `ModuleRegistry` | 模块注册与发现 |
| `self_modifier.py` | `SelfModifier` | 自我修改器 |
| `daemon.py` | `NexusDaemon` | 守护进程主循环 |

## CI 门禁（ci_gate.py）

```bash
python ci_gate.py
```

四道门禁依次执行：

1. **Import Verification** — 15 个子系统全部可导入
2. **Unit Tests** — pytest 全部通过（375 tests）
3. **Integration Smoke** — NexusIntegrator 完整管线运行
4. **Code Health** — 平均可维护性分数 ≥ 40

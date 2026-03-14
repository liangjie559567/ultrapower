# Phase 2: Agent 路由智能化实现计划

## 执行摘要

**目标**: 将当前基于关键词的 Agent 路由机制升级为智能化路由系统，通过任务特征分析和历史数据学习实现最优 Agent 选择。

**预期收益**:
- 路由准确率提升 30-40%
- Agent 执行成功率提升 25%
- 减少不必要的 Agent 升级/降级 50%
- 用户满意度提升（通过更精准的 Agent 匹配）

**时间估算**: 3-5 天（18-30 工时）

**风险等级**: 中等

---

## 1. 现状分析

### 1.1 当前路由机制

**关键词检测器** (`src/hooks/keyword-detector/index.ts`):
- **优势**:
  - 简单直接，响应快速
  - 优先级系统清晰（cancel > ralph > autopilot...）
  - 支持冲突解决（team vs autopilot）

- **局限**:
  - 纯正则匹配，无语义理解
  - 无法处理隐式意图
  - 缺乏上下文感知
  - 无历史学习能力

**Model Routing** (`src/features/model-routing/`):
- **已实现功能**:
  - 信号提取系统（词法、结构、上下文）
  - 复杂度评分机制（LOW/MEDIUM/HIGH）
  - 规则引擎（优先级、条件匹配）
  - Agent 特定路由（architect、planner、explore）

- **覆盖范围**:
  - 主要用于 Model 选择（haiku/sonnet/opus）
  - 部分 Agent 有快速路由（quickTierForAgent）
  - 未完全集成到主路由流程

**意图分类器** (`src/features/workflow-recommender/intent-classifier.ts`):
- 基础意图识别（feature-single、bug-fix、refactor 等）
- 简单模式匹配
- 未与路由系统集成

### 1.2 Agent 定义体系

**49 个独特 Agent** (`src/agents/definitions.ts`):

| 通道 | Agent | 默认模型 | 职责 |
|------|-------|----------|------|
| 构建/分析 | explore, analyst, planner, architect, debugger, executor, deep-executor, verifier | haiku-opus | 代码库探索、需求分析、规划、架构、调试、实现、验证 |
| 审查 | style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer | haiku-opus | 代码审查各维度 |
| 领域专家 | dependency-expert, test-engineer, build-fixer, designer, writer, qa-tester, scientist, git-master, database-expert, devops-engineer, i18n-specialist, accessibility-auditor, api-designer | sonnet | 专业领域支持 |
| 产品 | product-manager, ux-researcher, information-architect, product-analyst | sonnet | 产品策略和用户体验 |
| 协调 | critic, vision | opus/sonnet | 批判性审查和视觉分析 |
| Axiom | 14 个专用 Agent | sonnet | Axiom 工作流专用 |

**路由挑战**:
- 多个 Agent 职责重叠（如 architect vs planner vs analyst）
- 缺乏明确的任务→Agent 映射规则
- 用户意图与 Agent 能力的语义鸿沟

### 1.3 现有路由决策流程

```
用户输入 → 关键词检测 → Skill 激活 → Agent 选择（手动/默认）
                ↓
         意图识别（未集成）
                ↓
         Model Routing（部分使用）
```

**问题**:
1. 关键词检测只能触发 Skill，不能直接选择 Agent
2. Agent 选择主要依赖 Skill 内部逻辑或用户显式指定
3. 缺乏统一的智能路由层

---

## 2. 智能路由算法设计

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    智能路由引擎                              │
├─────────────────────────────────────────────────────────────┤
│  输入层: 任务特征提取                                        │
│  ├─ 意图分类（Intent Classifier）                           │
│  ├─ 复杂度分析（Complexity Analyzer）                       │
│  ├─ 领域识别（Domain Detector）                             │
│  └─ 上下文感知（Context Awareness）                         │
├─────────────────────────────────────────────────────────────┤
│  决策层: Agent 匹配                                          │
│  ├─ 规则引擎（Rule Engine）- 显式规则                       │
│  ├─ 相似度匹配（Similarity Matching）- 语义匹配             │
│  ├─ 历史学习（Historical Learning）- 成功模式               │
│  └─ 置信度评估（Confidence Scoring）                        │
├─────────────────────────────────────────────────────────────┤
│  输出层: 路由决策                                            │
│  ├─ 主 Agent 选择                                            │
│  ├─ 备选 Agent 列表                                          │
│  ├─ Model 层级建议                                           │
│  └─ 决策解释（Explainability）                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 任务特征提取

**扩展现有信号系统** (`src/features/model-routing/signals.ts`):

```typescript
interface TaskFeatures {
  // 现有信号
  lexical: LexicalSignals;
  structural: StructuralSignals;
  context: ContextSignals;

  // 新增特征
  intent: IntentSignals;      // 意图分类
  domain: DomainSignals;      // 领域识别
  workflow: WorkflowSignals;  // 工作流模式
  agent: AgentSignals;        // Agent 特定信号
}

interface IntentSignals {
  primaryIntent: IntentType;
  secondaryIntents: IntentType[];
  confidence: number;
  isAmbiguous: boolean;
}

interface DomainSignals {
  domains: string[];          // ['frontend', 'security', 'database']
  primaryDomain: string;
  requiresMultiDomain: boolean;
}

interface WorkflowSignals {
  pattern: 'single-shot' | 'iterative' | 'pipeline' | 'parallel';
  estimatedSteps: number;
  requiresVerification: boolean;
}

interface AgentSignals {
  explicitAgentRequest: string | null;  // 用户明确指定
  suggestedAgents: string[];            // 基于特征推荐
  excludedAgents: string[];             // 不适合的 Agent
}
```

### 2.3 Agent 匹配算法

**三层匹配策略**:

#### Layer 1: 规则引擎（显式匹配）

```typescript
// 高优先级规则
const EXPLICIT_RULES: RoutingRule[] = [
  {
    name: 'explicit-agent-request',
    priority: 100,
    condition: (features) => features.agent.explicitAgentRequest !== null,
    action: (features) => features.agent.explicitAgentRequest
  },
  {
    name: 'security-domain-mandatory',
    priority: 90,
    condition: (features) => features.domain.primaryDomain === 'security',
    action: () => 'security-reviewer'
  },
  {
    name: 'architecture-planning',
    priority: 85,
    condition: (features) =>
      features.intent.primaryIntent === 'plan' &&
      features.lexical.hasArchitectureKeywords,
    action: () => 'architect'
  },
  // ... 更多规则
];
```

#### Layer 2: 语义相似度匹配

```typescript
interface AgentCapability {
  agent: string;
  keywords: string[];
  intents: IntentType[];
  domains: string[];
  complexity: ComplexityTier[];
  embedding?: number[];  // 未来：语义向量
}

function calculateSimilarity(
  features: TaskFeatures,
  capability: AgentCapability
): number {
  let score = 0;

  // 意图匹配 (40%)
  if (capability.intents.includes(features.intent.primaryIntent)) {
    score += 0.4;
  }

  // 领域匹配 (30%)
  const domainOverlap = features.domain.domains.filter(d =>
    capability.domains.includes(d)
  ).length;
  score += (domainOverlap / features.domain.domains.length) * 0.3;

  // 复杂度匹配 (20%)
  const tier = calculateComplexityTier(features);
  if (capability.complexity.includes(tier)) {
    score += 0.2;
  }

  // 关键词匹配 (10%)
  const keywordMatch = countKeywordMatches(features, capability.keywords);
  score += Math.min(keywordMatch / 3, 0.1);

  return score;
}
```

#### Layer 3: 历史学习

```typescript
interface RoutingHistory {
  taskHash: string;
  features: TaskFeatures;
  selectedAgent: string;
  success: boolean;
  executionTime: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  timestamp: number;
}

function getHistoricalRecommendation(
  features: TaskFeatures,
  history: RoutingHistory[]
): { agent: string; confidence: number } | null {
  // 查找相似任务
  const similar = history
    .filter(h => h.success && cosineSimilarity(h.features, features) > 0.8)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  if (similar.length === 0) return null;

  // 统计最常用的成功 Agent
  const agentCounts = new Map<string, number>();
  similar.forEach(h => {
    agentCounts.set(h.selectedAgent, (agentCounts.get(h.selectedAgent) || 0) + 1);
  });

  const [agent, count] = Array.from(agentCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];

  return {
    agent,
    confidence: count / similar.length
  };
}
```

### 2.4 决策融合

```typescript
interface RoutingDecision {
  primaryAgent: string;
  confidence: number;
  alternatives: Array<{ agent: string; score: number }>;
  model: ModelType;
  reasons: string[];
  metadata: {
    ruleMatched?: string;
    similarityScore?: number;
    historicalConfidence?: number;
  };
}

function makeRoutingDecision(features: TaskFeatures): RoutingDecision {
  // 1. 尝试规则引擎
  const ruleMatch = evaluateRules(features);
  if (ruleMatch && ruleMatch.confidence > 0.9) {
    return {
      primaryAgent: ruleMatch.agent,
      confidence: ruleMatch.confidence,
      alternatives: [],
      model: getModelForAgent(ruleMatch.agent, features),
      reasons: [`Rule matched: ${ruleMatch.ruleName}`],
      metadata: { ruleMatched: ruleMatch.ruleName }
    };
  }

  // 2. 语义相似度匹配
  const similarities = AGENT_CAPABILITIES
    .map(cap => ({
      agent: cap.agent,
      score: calculateSimilarity(features, cap)
    }))
    .sort((a, b) => b.score - a.score);

  // 3. 历史学习加权
  const historical = getHistoricalRecommendation(features, routingHistory);
  if (historical && historical.confidence > 0.7) {
    // 提升历史推荐的权重
    const idx = similarities.findIndex(s => s.agent === historical.agent);
    if (idx !== -1) {
      similarities[idx].score *= (1 + historical.confidence * 0.5);
      similarities.sort((a, b) => b.score - a.score);
    }
  }

  // 4. 融合决策
  const primaryAgent = similarities[0].agent;
  const confidence = calculateFinalConfidence(
    similarities[0].score,
    historical?.confidence,
    ruleMatch?.confidence
  );

  return {
    primaryAgent,
    confidence,
    alternatives: similarities.slice(1, 4),
    model: getModelForAgent(primaryAgent, features),
    reasons: buildReasons(similarities[0], historical, ruleMatch),
    metadata: {
      similarityScore: similarities[0].score,
      historicalConfidence: historical?.confidence
    }
  };
}
```

---

## 3. 路由决策指标和验证方法

### 3.1 核心指标

**准确性指标**:
- **路由准确率**: 选择的 Agent 能成功完成任务的比例
  - 目标: ≥85% (当前估计 ~60%)
  - 测量: `成功任务数 / 总任务数`

- **首选命中率**: 第一次选择即正确的比例
  - 目标: ≥75%
  - 测量: `无需重试的任务数 / 总任务数`

- **Top-3 准确率**: 正确 Agent 在前 3 个候选中的比例
  - 目标: ≥95%
  - 测量: 备选列表覆盖率

**效率指标**:
- **平均决策时间**: 路由决策耗时
  - 目标: <50ms (P95 <100ms)
  - 测量: 路由函数执行时间

- **Agent 切换率**: 任务执行中切换 Agent 的频率
  - 目标: <15% (当前估计 ~30%)
  - 测量: `切换次数 / 总任务数`

**质量指标**:
- **决策置信度**: 路由决策的平均置信度
  - 目标: ≥0.75
  - 测量: 加权平均置信度分数

- **用户满意度**: 用户对 Agent 选择的满意度
  - 目标: ≥4.0/5.0
  - 测量: 隐式反馈（任务完成率、重试率）

### 3.2 验证方法

**离线验证**:

```typescript
// 测试数据集
interface TestCase {
  id: string;
  prompt: string;
  expectedAgent: string;
  expectedModel: ModelType;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const TEST_SUITE: TestCase[] = [
  {
    id: 'arch-001',
    prompt: 'Design the system architecture for microservices migration',
    expectedAgent: 'architect',
    expectedModel: 'opus',
    category: 'architecture',
    difficulty: 'hard'
  },
  {
    id: 'debug-001',
    prompt: 'Find the root cause of authentication failure',
    expectedAgent: 'debugger',
    expectedModel: 'sonnet',
    category: 'debugging',
    difficulty: 'medium'
  },
  // ... 50+ 测试用例
];

function runOfflineValidation() {
  const results = TEST_SUITE.map(test => {
    const decision = makeRoutingDecision(extractFeatures(test.prompt));
    return {
      testId: test.id,
      expected: test.expectedAgent,
      actual: decision.primaryAgent,
      correct: decision.primaryAgent === test.expectedAgent,
      confidence: decision.confidence,
      inTop3: decision.alternatives.slice(0, 3)
        .some(alt => alt.agent === test.expectedAgent)
    };
  });

  return {
    accuracy: results.filter(r => r.correct).length / results.length,
    top3Accuracy: results.filter(r => r.correct || r.inTop3).length / results.length,
    avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  };
}
```

**在线验证（A/B 测试）**:

```typescript
interface ABTestConfig {
  enabled: boolean;
  trafficSplit: number;  // 0.0-1.0, 新算法流量比例
  controlGroup: 'keyword-based';
  treatmentGroup: 'intelligent-routing';
}

function routeWithABTest(prompt: string, config: ABTestConfig): RoutingDecision {
  const useNewAlgorithm = Math.random() < config.trafficSplit;

  const decision = useNewAlgorithm
    ? intelligentRouting(prompt)
    : keywordBasedRouting(prompt);

  // 记录实验数据
  logABTestMetric({
    group: useNewAlgorithm ? 'treatment' : 'control',
    decision,
    timestamp: Date.now()
  });

  return decision;
}
```

**反馈循环**:

```typescript
interface RoutingFeedback {
  taskId: string;
  selectedAgent: string;
  success: boolean;
  executionTime: number;
  errorType?: string;
  userOverride?: string;  // 用户手动切换到的 Agent
}

function collectFeedback(feedback: RoutingFeedback) {
  // 1. 更新历史记录
  routingHistory.push({
    taskHash: hashTask(feedback.taskId),
    selectedAgent: feedback.selectedAgent,
    success: feedback.success,
    timestamp: Date.now()
  });

  // 2. 如果失败，分析原因
  if (!feedback.success) {
    analyzeFailure(feedback);
  }

  // 3. 如果用户覆盖，学习偏好
  if (feedback.userOverride) {
    learnUserPreference(feedback);
  }
}
```

### 3.3 监控和可观测性

```typescript
interface RoutingMetrics {
  timestamp: number;
  totalDecisions: number;
  accuracyRate: number;
  avgConfidence: number;
  avgDecisionTime: number;
  agentDistribution: Record<string, number>;
  failureReasons: Record<string, number>;
}

// 实时监控
function emitMetrics() {
  const metrics: RoutingMetrics = {
    timestamp: Date.now(),
    totalDecisions: routingHistory.length,
    accuracyRate: calculateAccuracy(),
    avgConfidence: calculateAvgConfidence(),
    avgDecisionTime: calculateAvgDecisionTime(),
    agentDistribution: getAgentDistribution(),
    failureReasons: getFailureReasons()
  };

  // 写入 .omc/metrics/routing-metrics.json
  writeMetrics(metrics);
}
```

---

## 4. 任务分解与时间估算

### Phase 2.1: 特征提取增强 (1-1.5 天)

**任务**:
- [ ] 扩展 IntentSignals 接口和实现
- [ ] 实现 DomainSignals 检测器
- [ ] 实现 WorkflowSignals 分析器
- [ ] 实现 AgentSignals 提取器
- [ ] 集成到现有 signals.ts

**交付物**:
- `src/features/agent-routing/signals.ts` (扩展)
- `src/features/agent-routing/domain-detector.ts` (新)
- `src/features/agent-routing/workflow-analyzer.ts` (新)
- 单元测试 (覆盖率 ≥80%)

**风险**:
- 低：基于现有 model-routing 架构扩展

### Phase 2.2: Agent 能力建模 (0.5-1 天)

**任务**:
- [ ] 定义 AgentCapability 数据结构
- [ ] 为 49 个 Agent 建立能力档案
- [ ] 实现能力加载和缓存机制

**交付物**:
- `src/features/agent-routing/capabilities.ts`
- `src/features/agent-routing/agent-profiles.json`

**风险**:
- 中：需要准确理解每个 Agent 的职责边界

### Phase 2.3: 匹配算法实现 (1-1.5 天)

**任务**:
- [ ] 实现规则引擎 (基于现有 rules.ts 扩展)
- [ ] 实现相似度匹配算法
- [ ] 实现历史学习模块
- [ ] 实现决策融合逻辑

**交付物**:
- `src/features/agent-routing/matcher.ts`
- `src/features/agent-routing/historical-learner.ts`
- `src/features/agent-routing/router.ts` (核心路由器)

**风险**:
- 中：算法调优需要迭代

### Phase 2.4: 集成和测试 (0.5-1 天)

**任务**:
- [ ] 集成到 keyword-detector hook
- [ ] 实现 A/B 测试框架
- [ ] 创建测试数据集 (50+ 用例)
- [ ] 运行离线验证
- [ ] 性能基准测试

**交付物**:
- `src/hooks/keyword-detector/intelligent-router.ts`
- `src/features/agent-routing/__tests__/integration.test.ts`
- `src/features/agent-routing/__tests__/benchmark.test.ts`
- `.omc/test-data/routing-test-suite.json`

**风险**:
- 低：集成点清晰

### Phase 2.5: 监控和反馈 (0.5 天)

**任务**:
- [ ] 实现指标收集
- [ ] 实现反馈循环
- [ ] 创建监控仪表板数据结构
- [ ] 文档更新

**交付物**:
- `src/features/agent-routing/metrics.ts`
- `src/features/agent-routing/feedback.ts`
- `.omc/metrics/routing-metrics.json` (模板)
- `docs/agent-routing.md` (使用文档)

**风险**:
- 低：独立模块

---

## 5. 依赖项和前置条件

### 5.1 技术依赖

**现有模块**:
- ✅ `src/features/model-routing/` - 信号提取和评分系统
- ✅ `src/features/workflow-recommender/` - 意图分类器
- ✅ `src/agents/definitions.ts` - Agent 定义
- ✅ `src/hooks/keyword-detector/` - 关键词检测

**需要的新依赖**:
- 无（使用现有技术栈）

### 5.2 数据依赖

**需要收集**:
- Agent 能力档案（手动整理，基于 CLAUDE.md 和 agent prompts）
- 测试数据集（手动创建 50+ 典型场景）
- 历史路由数据（可选，初期使用模拟数据）

### 5.3 前置条件

- ✅ TypeScript 构建环境正常
- ✅ 测试框架 (Vitest) 可用
- ✅ 现有 model-routing 模块稳定

---

## 6. 风险评估和缓解策略

### 6.1 技术风险

| 风险 | 等级 | 影响 | 缓解策略 |
|------|------|------|----------|
| 算法准确率不达标 | 中 | 用户体验下降 | 1. 保留关键词检测作为后备<br>2. A/B 测试逐步切换<br>3. 用户可手动覆盖 |
| 性能开销过大 | 低 | 响应延迟 | 1. 缓存能力档案<br>2. 异步决策（非阻塞）<br>3. 性能基准测试 |
| 与现有系统集成冲突 | 低 | 功能回归 | 1. 渐进式集成<br>2. 特性开关控制<br>3. 完整回归测试 |

### 6.2 产品风险

| 风险 | 等级 | 影响 | 缓解策略 |
|------|------|------|----------|
| 用户不信任智能路由 | 中 | 采用率低 | 1. 提供决策解释<br>2. 显示置信度<br>3. 允许手动覆盖 |
| Agent 能力建模不准确 | 中 | 路由错误 | 1. 基于实际 prompt 建模<br>2. 持续迭代优化<br>3. 收集用户反馈 |
| 历史数据不足 | 低 | 学习效果差 | 1. 初期依赖规则引擎<br>2. 使用模拟数据训练<br>3. 冷启动策略 |

### 6.3 时间风险

| 风险 | 等级 | 影响 | 缓解策略 |
|------|------|------|----------|
| Agent 能力建模耗时超预期 | 中 | 延期 | 1. 优先核心 20 个 Agent<br>2. 其他 Agent 使用默认配置<br>3. 并行工作 |
| 测试数据集创建耗时 | 低 | 验证不充分 | 1. 从现有 issue/PR 提取<br>2. 使用 LLM 生成测试用例<br>3. 最小 30 个用例即可启动 |

---

## 7. 成功标准

### 7.1 必须达成 (Must Have)

- ✅ 路由准确率 ≥75%
- ✅ 平均决策时间 <100ms
- ✅ 测试覆盖率 ≥80%
- ✅ 向后兼容（不破坏现有功能）
- ✅ 文档完整（API 文档 + 使用指南）

### 7.2 期望达成 (Should Have)

- ✅ 路由准确率 ≥85%
- ✅ Top-3 准确率 ≥95%
- ✅ A/B 测试框架就绪
- ✅ 实时监控指标
- ✅ 决策可解释性

### 7.3 可选达成 (Nice to Have)

- ⭕ 历史学习模块完全启用
- ⭕ 用户偏好学习
- ⭕ 可视化监控仪表板
- ⭕ 自动化调优

---

## 8. 实施计划时间表

```
Day 1 (6h):
├─ AM: Phase 2.1 - 特征提取增强 (3h)
│  ├─ IntentSignals 扩展
│  ├─ DomainSignals 实现
│  └─ 单元测试
└─ PM: Phase 2.1 续 + Phase 2.2 开始 (3h)
   ├─ WorkflowSignals 实现
   └─ AgentCapability 数据结构

Day 2 (6h):
├─ AM: Phase 2.2 - Agent 能力建模 (3h)
│  ├─ 核心 20 个 Agent 档案
│  └─ 能力加载机制
└─ PM: Phase 2.3 开始 - 匹配算法 (3h)
   ├─ 规则引擎扩展
   └─ 相似度匹配算法

Day 3 (6h):
├─ AM: Phase 2.3 续 - 匹配算法 (3h)
│  ├─ 历史学习模块
│  └─ 决策融合逻辑
└─ PM: Phase 2.4 - 集成和测试 (3h)
   ├─ 集成到 keyword-detector
   └─ 测试数据集创建

Day 4 (6h):
├─ AM: Phase 2.4 续 - 测试 (3h)
│  ├─ 离线验证
│  ├─ 性能基准测试
│  └─ 回归测试
└─ PM: Phase 2.5 - 监控和反馈 (3h)
   ├─ 指标收集
   ├─ 反馈循环
   └─ 文档更新

Day 5 (可选，缓冲时间):
└─ 调优和优化 (6h)
   ├─ 算法参数调优
   ├─ 性能优化
   └─ 补充测试用例
```

**总计**: 18-30 工时（3-5 天）

---

## 9. 验收标准

### 9.1 功能验收

- [ ] 所有 49 个 Agent 都有能力档案（至少核心 20 个完整）
- [ ] 路由决策 API 可用且稳定
- [ ] 测试套件通过率 100%
- [ ] 离线验证准确率 ≥75%
- [ ] 性能基准测试通过（P95 <100ms）

### 9.2 质量验收

- [ ] 代码审查通过（无 critical issues）
- [ ] 测试覆盖率 ≥80%
- [ ] TypeScript 类型检查通过
- [ ] 无 ESLint 错误
- [ ] 文档完整且准确

### 9.3 集成验收

- [ ] 与现有 keyword-detector 无缝集成
- [ ] 不破坏现有 Skill 触发逻辑
- [ ] A/B 测试框架可用
- [ ] 监控指标正常收集

---

## 10. 后续优化方向

### 10.1 短期优化 (1-2 周)

- 收集真实使用数据，优化 Agent 能力档案
- 基于反馈调整相似度算法权重
- 扩展测试数据集到 100+ 用例
- 实现用户偏好学习

### 10.2 中期优化 (1-3 月)

- 引入语义向量（embeddings）提升匹配精度
- 实现多 Agent 协作路由（pipeline 推荐）
- 自动化 A/B 测试和指标分析
- 可视化监控仪表板

### 10.3 长期愿景 (3-6 月)

- 强化学习优化路由策略
- 跨项目知识迁移
- 个性化路由（用户级偏好）
- Agent 能力自动发现和更新

---

## 11. 参考资料

### 11.1 相关文件

- `src/hooks/keyword-detector/index.ts` - 当前关键词检测
- `src/features/model-routing/` - Model 路由系统
- `src/agents/definitions.ts` - Agent 定义
- `docs/CLAUDE.md` - Agent 路由规则文档
- `docs/standards/agent-lifecycle.md` - Agent 生命周期

### 11.2 设计参考

- Model Routing 信号系统设计
- Keyword Detector 优先级系统
- Workflow Recommender 意图分类

---

## 附录 A: Agent 能力档案示例

```json
{
  "architect": {
    "description": "System design, boundaries, interfaces, long-term tradeoffs",
    "intents": ["plan", "refactor", "review"],
    "domains": ["architecture", "system-design", "infrastructure"],
    "complexity": ["HIGH"],
    "keywords": [
      "architecture", "design", "system", "boundary", "interface",
      "scalability", "tradeoff", "pattern", "structure"
    ],
    "antiKeywords": ["quick fix", "simple change", "typo"],
    "defaultModel": "opus",
    "estimatedTaskDuration": "long"
  },
  "executor": {
    "description": "Code implementation, refactoring, feature development",
    "intents": ["feature-single", "feature-multiple", "refactor"],
    "domains": ["generic", "frontend", "backend"],
    "complexity": ["MEDIUM", "HIGH"],
    "keywords": [
      "implement", "add", "create", "build", "refactor",
      "update", "modify", "change"
    ],
    "antiKeywords": ["plan", "design", "review only"],
    "defaultModel": "sonnet",
    "estimatedTaskDuration": "medium"
  }
}
```

---

**计划版本**: v1.0
**创建日期**: 2026-03-12
**负责人**: planner-3
**审核状态**: 待审核

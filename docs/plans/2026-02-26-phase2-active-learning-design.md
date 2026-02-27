# Phase 2 主动学习架构设计

> **状态：** 设计草稿 | **日期：** 2026-02-26 | **分支：** feat/phase2-active-learning

## 背景

Phase 1（被动学习 MVP）已完成并合并到 main。它建立了：
- Skill 文件发现、解析、匹配、注入基础设施
- 基于触发词的被动注入（用户消息 → 匹配 → 注入上下文）
- 模式检测（`auto-learner.ts`）：问题-解决方案对，置信度评分
- 自动调用决策（`auto-invoke.ts`）：置信度阈值、冷却时间
- 使用指标追踪（`usage-tracker.ts`）
- 会话结束自动反思（`session-reflector.ts`）
- 进化引擎编排（`orchestrator.ts`）

**Phase 1 的核心局限：**
1. 没有用户反馈回路——skill 注入后不知道是否有用
2. 没有 skill 效果验证——无法知道注入的 skill 是否被采纳
3. 没有主动推荐界面——只是静默注入，用户无感知
4. 没有 skill 质量迭代——无法基于使用结果改进 skill 内容
5. 没有跨会话学习聚合——每次会话独立，无法积累洞见

## Phase 2 目标

**主动学习** = 系统能主动感知、评估、改进自身的 skill 库

核心能力：
1. **反馈收集**：用户对注入 skill 的有用性评分
2. **效果追踪**：检测 skill 是否被实际采纳（行为变化检测）
3. **主动推荐**：在合适时机主动建议用户保存新 skill
4. **质量迭代**：基于反馈自动改进 skill 内容
5. **跨会话聚合**：将多会话的学习结果合并为更强的 skill

---

## 架构设计

### 核心模块（新增）

```
src/hooks/learner/
├── [Phase 1 已有文件...]
│
├── feedback/                    # 新增：反馈系统
│   ├── collector.ts             # 反馈收集接口
│   ├── storage.ts               # 反馈持久化
│   └── types.ts                 # 反馈类型定义
│
├── effectiveness/               # 新增：效果追踪
│   ├── tracker.ts               # 行为变化检测
│   ├── adoption-detector.ts     # Skill 采纳检测
│   └── types.ts
│
├── recommender/                 # 新增：主动推荐
│   ├── engine.ts                # 推荐决策引擎
│   ├── timing.ts                # 推荐时机判断
│   └── formatter.ts             # 推荐消息格式化
│
└── quality/                     # 新增：质量迭代
    ├── improver.ts              # Skill 内容改进
    ├── aggregator.ts            # 跨会话聚合
    └── types.ts
```

### 数据流

```
用户消息
    ↓
[Phase 1] 触发词匹配 → 被动注入
    ↓
助手响应
    ↓
[Phase 2] 效果追踪 → 采纳检测
    ↓
[Phase 2] 反馈收集 → 用户评分（可选）
    ↓
[Phase 2] 质量评估 → 更新 skill 置信度
    ↓
[Phase 2] 主动推荐 → 建议保存新 skill
    ↓
[Phase 2] 跨会话聚合 → 改进 skill 内容
```

---

## 模块详细设计

### 1. 反馈系统（`feedback/`）

**目标：** 收集用户对注入 skill 的有用性评分

**`collector.ts`**
```typescript
interface FeedbackRequest {
  skillId: string;
  skillName: string;
  sessionId: string;
  injectedAt: number;
  context: string; // 注入时的用户消息摘要
}

interface FeedbackResponse {
  skillId: string;
  rating: 'helpful' | 'not_helpful' | 'partially_helpful';
  comment?: string;
  timestamp: number;
}

// 在助手响应后，如果注入了 skill，生成反馈请求
function generateFeedbackPrompt(request: FeedbackRequest): string;

// 解析用户的反馈响应
function parseFeedbackFromMessage(message: string): FeedbackResponse | null;
```

**`storage.ts`**
- 存储路径：`.omc/axiom/evolution/skill_feedback.json`
- 结构：`{ skillId: { ratings: [], averageScore: number, lastUpdated: string } }`
- 使用 `atomicWriteJson` 防止并发写入

**触发时机：**
- 注入 skill 后的第 2-3 条消息（给用户时间使用 skill）
- 每个 skill 每会话最多请求一次反馈
- 置信度 > 80% 的 skill 才请求反馈（避免噪音）

---

### 2. 效果追踪（`effectiveness/`）

**目标：** 无需用户主动反馈，自动检测 skill 是否被采纳

**`adoption-detector.ts`**

检测信号：
- **代码模式匹配**：助手响应中是否出现 skill 建议的代码模式
- **行为关键词**：响应中是否包含 skill 中的关键术语
- **问题解决**：用户后续消息是否表明问题已解决（"谢谢"、"成功了"、"works"）

```typescript
interface AdoptionSignal {
  type: 'code_pattern' | 'keyword_match' | 'problem_solved' | 'user_confirmed';
  confidence: number; // 0-100
  evidence: string;   // 具体证据
}

interface AdoptionResult {
  skillId: string;
  adopted: boolean;
  signals: AdoptionSignal[];
  overallConfidence: number;
}

function detectAdoption(
  skillContent: string,
  assistantResponse: string,
  subsequentMessages: string[]
): AdoptionResult;
```

**`tracker.ts`**
- 维护会话内的 skill 注入记录
- 在每条助手响应后检测采纳信号
- 将采纳结果写入 `usage_metrics.json`（扩展 Phase 1 的 `UsageMetrics`）

---

### 3. 主动推荐引擎（`recommender/`）

**目标：** 在合适时机主动建议用户保存新 skill

**`timing.ts`** — 推荐时机判断

触发条件（AND 逻辑）：
1. `auto-learner.ts` 检测到置信度 ≥ 70 的模式
2. 该模式在本会话出现 ≥ 2 次
3. 距上次推荐 ≥ 10 条消息（冷却）
4. 本会话推荐次数 < 3（避免打扰）

```typescript
interface RecommendationTiming {
  shouldRecommend: boolean;
  reason: string;
  pattern: PatternDetection;
  urgency: 'low' | 'medium' | 'high';
}

function evaluateRecommendationTiming(
  state: AutoLearnerState,
  sessionState: SessionDetectionState
): RecommendationTiming;
```

**`engine.ts`** — 推荐决策引擎

```typescript
interface SkillRecommendation {
  pattern: PatternDetection;
  suggestedName: string;
  suggestedContent: string; // 预生成的 skill 内容草稿
  targetScope: 'user' | 'project';
  confidence: number;
}

// 生成 skill 推荐
function generateRecommendation(pattern: PatternDetection): SkillRecommendation;

// 用户确认后保存 skill
function saveRecommendedSkill(
  recommendation: SkillRecommendation,
  userApproved: boolean,
  userEdits?: Partial<SkillRecommendation>
): Promise<string>; // 返回保存路径
```

**`formatter.ts`** — 推荐消息格式化

```typescript
// 生成向用户展示的推荐消息
function formatRecommendationMessage(rec: SkillRecommendation): string;

// 解析用户对推荐的响应（yes/no/edit）
function parseRecommendationResponse(message: string): {
  action: 'save' | 'skip' | 'edit';
  edits?: string;
};
```

---

### 4. 质量迭代（`quality/`）

**目标：** 基于反馈和采纳数据自动改进 skill 内容

**`improver.ts`** — Skill 内容改进

改进策略：
- **触发词优化**：基于实际触发场景，添加/删除触发词
- **内容精炼**：基于采纳模式，突出最有效的部分
- **示例更新**：用实际使用案例替换通用示例

```typescript
interface ImprovementSuggestion {
  skillId: string;
  type: 'trigger_update' | 'content_refinement' | 'example_update';
  currentValue: string;
  suggestedValue: string;
  reason: string;
  confidence: number;
}

function generateImprovements(
  skill: LearnedSkill,
  feedbackHistory: FeedbackResponse[],
  adoptionHistory: AdoptionResult[]
): ImprovementSuggestion[];

// 应用改进（需用户确认或自动应用低风险改进）
function applyImprovement(
  skillPath: string,
  suggestion: ImprovementSuggestion,
  autoApply: boolean
): Promise<void>;
```

**`aggregator.ts`** — 跨会话聚合

```typescript
interface AggregatedInsight {
  pattern: string;
  occurrences: number;
  sessions: string[];
  averageAdoptionRate: number;
  suggestedSkillContent: string;
}

// 从多会话的 usage_metrics.json 聚合洞见
function aggregateInsights(directory: string): AggregatedInsight[];

// 将聚合洞见转化为 skill 改进建议
function insightsToImprovements(insights: AggregatedInsight[]): ImprovementSuggestion[];
```

---

## 集成点

### Hook 集成

**`UserPromptSubmit` hook（`skill-injector.mjs`）**
- 现有：触发词匹配 → 被动注入
- 新增：检查是否有待推荐的 skill → 附加推荐消息

**`PostToolUse` hook（新增 `skill-feedback.mjs`）**
- 在助手响应后触发
- 运行采纳检测
- 判断是否需要请求反馈

**`SessionEnd` hook（`session-reflector.ts`）**
- 现有：触发 Axiom 反思
- 新增：运行跨会话聚合，生成改进建议

### 配置扩展（`.omc-config.json`）

```json
{
  "learner": {
    "enabled": true,
    "phase2": {
      "feedbackEnabled": true,
      "feedbackCooldownMessages": 3,
      "recommendationEnabled": true,
      "recommendationCooldownMessages": 10,
      "maxRecommendationsPerSession": 3,
      "autoImproveEnabled": false,
      "adoptionDetectionEnabled": true
    }
  }
}
```

---

## 存储结构

```
.omc/axiom/evolution/
├── usage_metrics.json          # Phase 1 已有，扩展采纳数据
├── skill_feedback.json         # 新增：用户反馈记录
├── skill_adoption.json         # 新增：采纳检测结果
├── recommendations.json        # 新增：推荐历史
└── improvement_queue.json      # 新增：待处理改进建议
```

---

## 实现优先级

### P0（核心功能，必须实现）
1. **反馈收集**（`feedback/collector.ts` + `storage.ts`）
2. **主动推荐引擎**（`recommender/engine.ts` + `timing.ts`）
3. **Hook 集成**（扩展 `skill-injector.mjs`，新增 `skill-feedback.mjs`）

### P1（重要功能）
4. **采纳检测**（`effectiveness/adoption-detector.ts`）
5. **触发词优化**（`quality/improver.ts` 的触发词部分）
6. **配置扩展**（`config.ts` 扩展）

### P2（增强功能）
7. **跨会话聚合**（`quality/aggregator.ts`）
8. **内容精炼**（`quality/improver.ts` 的内容部分）
9. **效果仪表盘**（`/ultrapower:learner` skill 扩展）

---

## 风险与约束

| 风险 | 影响 | 缓解策略 |
|------|------|---------|
| 反馈请求打扰用户 | 高 | 严格冷却时间 + 每会话上限 |
| 采纳检测误报 | 中 | 多信号 AND 逻辑，高置信度阈值 |
| 自动改进破坏 skill | 高 | 默认关闭自动改进，需用户确认 |
| 存储文件过大 | 低 | 定期清理 + 条目上限 |
| Hook 性能影响 | 中 | 异步处理，3s 超时保护 |

---

## 验收标准

- [ ] 用户注入 skill 后，系统能在适当时机请求反馈
- [ ] 反馈数据正确持久化到 `skill_feedback.json`
- [ ] 系统能检测到 skill 被采纳的信号（≥ 70% 准确率）
- [ ] 当模式置信度 ≥ 70 且出现 ≥ 2 次时，系统主动推荐保存 skill
- [ ] 用户确认后，推荐的 skill 正确保存到 `.omc/skills/`
- [ ] 所有新功能可通过配置独立开关
- [ ] 新增代码通过 `npm test` 和 `tsc --noEmit`
- [ ] 不破坏 Phase 1 的任何现有功能

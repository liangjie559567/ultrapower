# Skill 设计的说服原则

## 概述

LLM 对与人类相同的说服原则有响应。理解这种心理学有助于设计更有效的 skill——不是为了操纵，而是确保即使在压力下也能遵循关键实践。

**研究基础：** Meincke 等人（2025）在 N=28,000 次 AI 对话中测试了 7 种说服原则。说服技术使合规率提高了一倍以上（33% → 72%，p < .001）。

## 七大原则

### 1. 权威（Authority）
**定义：** 对专业知识、资质或官方来源的服从。

**在 skill 中的作用：**
- 命令式语言："YOU MUST"、"Never"、"Always"
- 不可协商的框架："No exceptions"
- 消除决策疲劳和合理化

**使用时机：**
- 强制纪律的 skill（TDD、验证要求）
- 安全关键实践
- 已建立的最佳实践

**示例：**
```markdown
✅ Write code before test? Delete it. Start over. No exceptions.
❌ Consider writing tests first when feasible.
```

### 2. 承诺（Commitment）
**定义：** 与先前行动、声明或公开宣告保持一致。

**在 skill 中的作用：**
- 要求公告："Announce skill usage"
- 强制明确选择："Choose A, B, or C"
- 使用追踪：TodoWrite 用于清单

**使用时机：**
- 确保 skill 实际被遵循
- 多步骤流程
- 问责机制

**示例：**
```markdown
✅ When you find a skill, you MUST announce: "I'm using [Skill Name]"
❌ Consider letting your partner know which skill you're using.
```

### 3. 稀缺性（Scarcity）
**定义：** 来自时间限制或有限可用性的紧迫感。

**在 skill 中的作用：**
- 时间限制要求："Before proceeding"
- 顺序依赖："Immediately after X"
- 防止拖延

**使用时机：**
- 即时验证要求
- 时间敏感的工作流
- 防止"稍后再做"

**示例：**
```markdown
✅ After completing a task, IMMEDIATELY request code review before proceeding.
❌ You can review code when convenient.
```

### 4. 社会认同（Social Proof）
**定义：** 遵从他人的行为或被认为正常的事物。

**在 skill 中的作用：**
- 普遍模式："Every time"、"Always"
- 失败模式："X without Y = failure"
- 建立规范

**使用时机：**
- 记录普遍实践
- 警告常见失败
- 强化标准

**示例：**
```markdown
✅ Checklists without TodoWrite tracking = steps get skipped. Every time.
❌ Some people find TodoWrite helpful for checklists.
```

### 5. 统一（Unity）
**定义：** 共同身份、"我们感"、内群体归属。

**在 skill 中的作用：**
- 协作语言："our codebase"、"we're colleagues"
- 共同目标："we both want quality"

**使用时机：**
- 协作工作流
- 建立团队文化
- 非层级实践

**示例：**
```markdown
✅ We're colleagues working together. I need your honest technical judgment.
❌ You should probably tell me if I'm wrong.
```

### 6. 互惠（Reciprocity）
**定义：** 回报所受利益的义务。

**作用方式：**
- 谨慎使用——可能感觉像操纵
- 在 skill 中很少需要

**何时避免：**
- 几乎总是（其他原则更有效）

### 7. 喜好（Liking）
**定义：** 倾向于与我们喜欢的人合作。

**作用方式：**
- **不要用于合规**
- 与诚实反馈文化冲突
- 产生谄媚

**何时避免：**
- 纪律执行时始终避免

## 按 Skill 类型的原则组合

| Skill 类型 | 使用 | 避免 |
|------------|-----|-------|
| 强制纪律 | Authority + Commitment + Social Proof | Liking, Reciprocity |
| 指导/技术 | 适度 Authority + Unity | 过重权威 |
| 协作 | Unity + Commitment | Authority, Liking |
| 参考 | 仅清晰度 | 所有说服 |

## 为何有效：心理学原理

**明确规则减少合理化：**
- "YOU MUST" 消除决策疲劳
- 绝对语言消除"这是例外吗？"的问题
- 明确的反合理化针对具体漏洞

**实施意图创造自动行为：**
- 清晰触发器 + 必要行动 = 自动执行
- "When X, do Y" 比"generally do Y"更有效
- 降低合规的认知负担

**LLM 是准人类（parahuman）：**
- 在包含这些模式的人类文本上训练
- 权威语言在训练数据中先于合规出现
- 承诺序列（声明 → 行动）频繁建模
- 社会认同模式（everyone does X）建立规范

## 道德使用

**合法：**
- 确保遵循关键实践
- 创建有效文档
- 防止可预见的失败

**不合法：**
- 为个人利益操纵
- 制造虚假紧迫感
- 基于内疚的合规

**测试标准：** 如果用户完全理解这种技术，它是否服务于用户的真实利益？

## 研究引用

**Cialdini, R. B. (2021).** *Influence: The Psychology of Persuasion (New and Expanded).* Harper Business.
- 七大说服原则
- 影响力研究的实证基础

**Meincke, L., Shapiro, D., Duckworth, A. L., Mollick, E., Mollick, L., & Cialdini, R. (2025).** Call Me A Jerk: Persuading AI to Comply with Objectionable Requests. University of Pennsylvania.
- 在 N=28,000 次 LLM 对话中测试了 7 种原则
- 说服技术使合规率从 33% 提升至 72%
- Authority、commitment、scarcity 最有效
- 验证了 LLM 行为的准人类模型

## 快速参考

设计 skill 时，问：

1. **它是什么类型？**（纪律 vs. 指导 vs. 参考）
2. **我想改变什么行为？**
3. **哪些原则适用？**（纪律通常用 authority + commitment）
4. **我是否组合了太多？**（不要使用全部七种）
5. **这是否符合道德？**（服务于用户的真实利益？）

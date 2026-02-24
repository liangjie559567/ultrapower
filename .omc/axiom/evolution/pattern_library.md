# Axiom 代码模式库

## 模式格式
```
### P-[ID]: [模式名称]
- 状态: [active/candidate/deprecated]
- 出现次数: [N]
- 置信度: [0.0-1.0]
- 分类: [structural/behavioral/creational]
- 创建时间: [YYYY-MM-DD]
- 描述: [模式描述]
- 模板: [代码模板]
- 应用场景: [何时使用]
```

## 活跃模式

### P-001: ultrapower Agent 定义模式
- 状态: active
- 出现次数: 8
- 置信度: 0.95
- 分类: structural
- 创建时间: 2026-02-24
- 描述: ultrapower agent 文件的标准结构
- 模板:
```markdown
---
name: [agent-name]
description: "[描述]"
model: sonnet
---

<Agent_Prompt>

## Role
[角色定义]

## Input
[输入格式]

## Actions
[执行步骤]

## Output_Format
[输出格式]

## Constraints
[约束条件]

</Agent_Prompt>
```
- 应用场景: 创建新 ultrapower agent 时

### P-002: ultrapower Skill 定义模式
- 状态: active
- 出现次数: 12
- 置信度: 0.95
- 分类: structural
- 创建时间: 2026-02-24
- 描述: ultrapower skill 文件的标准结构
- 模板:
```markdown
---
name: [skill-name]
description: "/[command] — [描述]"
---

# [Skill 标题]

**开始时宣告：** "I'm using the [skill-name] skill to [purpose]."

## 执行步骤

### Step 1: [步骤名称]
[步骤描述]

### Step 2: [步骤名称]
[步骤描述]
```
- 应用场景: 创建新 ultrapower skill 时

### P-003: Axiom 三态门模式
- 状态: active
- 出现次数: 3
- 置信度: 0.85
- 分类: behavioral
- 创建时间: 2026-02-24
- 描述: 需求分析的三态输出（PASS/CLARIFY/REJECT）
- 模板:
```
输出格式:
- PASS: 需求清晰可行 → 继续下一步
- CLARIFY: 需要澄清 → 提出具体问题
- REJECT: 需求不可行 → 说明原因
```
- 应用场景: 需求分析阶段

## 候选模式
<!-- 出现次数 >= 2 但 < 3，或置信度 < 0.7 的模式 -->

## 废弃模式
<!-- 不再适用的模式 -->

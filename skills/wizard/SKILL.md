---
name: wizard
description: 交互式向导，通过3个问题引导用户选择合适的执行模式
---

<Purpose>
Wizard 是一个交互式向导，帮助不确定该使用哪个执行模式的用户，通过3个简单问题快速找到最合适的 ultrapower 命令。
</Purpose>

<Use_When>
- 用户说 "wizard"、"帮我选"、"不知道用什么"、"怎么开始"、"用哪个命令"
- 用户面对新任务不知道该用 autopilot/ralph/team/executor 哪个
- 用户第一次使用 ultrapower，需要引导
</Use_When>

<Do_Not_Use_When>
- 用户已经明确说了要用哪个模式
- 用户只是在问某个模式的用法
</Do_Not_Use_When>

<Execution>

## 第一步：问 Q1

使用 AskUserQuestion 工具提问：

```
问题: "你想做什么？"
选项:
  A. 新功能 / 构建新东西
  B. 修复 bug
  C. 代码审查
  D. 重构 / 优化
```

## 第二步：根据 Q1 路由

- **B（修复 bug）** → 直接推荐，跳到输出
  - 推荐: `systematic-debugging`
  - 原因: bug 修复需要先定位根因，再修复，systematic-debugging 提供结构化调试流程

- **C（代码审查）** → 直接推荐，跳到输出
  - 推荐: `code-review`
  - 原因: 代码审查有专门的多维度审查流水线

- **A 或 D** → 继续问 Q2

## 第三步：问 Q2（仅 A/D 路径）

使用 AskUserQuestion 工具提问：

```
问题: "任务复杂度大概是？"
选项:
  A. 简单（改动集中在1-2个文件）
  B. 中等（多文件改动，逻辑比较清晰）
  C. 复杂（架构级改动，需要规划设计）
```

## 第四步：根据 Q2 路由

- **A（简单）** → 直接推荐，跳到输出
  - 推荐: `executor agent`
  - 原因: 单文件改动不需要完整流水线，直接委托 executor 最高效

- **C（复杂）** → 直接推荐，跳到输出
  - 推荐: `team`
  - 原因: 架构级改动需要 plan→exec→verify 多 agent 协作流水线

- **B（中等）** → 继续问 Q3

## 第五步：问 Q3（仅中等复杂度路径）

使用 AskUserQuestion 工具提问：

```
问题: "这个任务需要持续运行直到完成吗？"
选项:
  A. 是，可能需要多轮迭代，不确定几次能完成
  B. 否，一次性执行，完成就好
```

## 第六步：根据 Q3 路由

- **A（需要持续运行）** → 推荐 `ralph`
- **B（一次性）** → 推荐 `autopilot`

## 输出格式

每次给出推荐时，使用以下格式：

```
推荐: /ultrapower:<mode> "<在这里填入你的任务描述>"

原因: <一句话解释为什么这个模式最合适>

备选方案:
  - /ultrapower:<alt1>  — <适用场景>
  - /ultrapower:<alt2>  — <适用场景>
```

### 各模式备选方案参考

**systematic-debugging 的备选**:
- `/ultrapower:executor` — 如果你已经知道问题在哪，直接修
- `/ultrapower:analyze` — 如果只需要分析，不需要修复

**code-review 的备选**:
- `/ultrapower:security-review` — 如果专注安全漏洞
- `/ultrapower:quality-reviewer` — 如果专注代码质量

**executor 的备选**:
- `/ultrapower:autopilot` — 如果任务比预期复杂
- `/ultrapower:ralph` — 如果需要持续迭代

**team 的备选**:
- `/ultrapower:autopilot` — 如果不需要多 agent 并行
- `/ultrapower:ralph` — 如果需要持续循环直到完成

**ralph 的备选**:
- `/ultrapower:autopilot` — 如果任务相对确定，一次能完成
- `/ultrapower:team` — 如果需要多 agent 并行协作

**autopilot 的备选**:
- `/ultrapower:ralph` — 如果任务可能需要多轮迭代
- `/ultrapower:team` — 如果需要多个 agent 并行协作

</Execution>

---
name: ax-review
description: "/ax-review — Axiom 专家评审工作流：5专家并行评审 → 冲突仲裁 → Rough PRD 生成"
---

# Axiom 专家评审工作流 (Phase 1.5)

本工作流通过 5 个专家角色的视角对 PRD 初稿进行反馈和优化。

**开始时宣告：** "I'm using the ax-review skill to start the expert review workflow."

## 前置条件

- PRD 初稿存在于 `docs/prd/[name]-draft.md`

## 执行步骤

### Step 1: 并行专家评审

并行启动 5 个专家角色评审（使用 Task 工具并行执行）：

```
# 并行执行以下 5 个 agent
Task(subagent_type="ultrapower:critic", model="sonnet", prompt="以 UX Director 角色评审 PRD：[draft内容]")
Task(subagent_type="ultrapower:critic", model="sonnet", prompt="以 Product Director 角色评审 PRD：[draft内容]")
Task(subagent_type="ultrapower:critic", model="sonnet", prompt="以 Domain Expert 角色评审 PRD：[draft内容]")
Task(subagent_type="ultrapower:critic", model="sonnet", prompt="以 Tech Lead 角色评审 PRD：[draft内容]")
Task(subagent_type="ultrapower:critic", model="opus", prompt="以 Critic 角色评审 PRD（安全/质量）：[draft内容]")
```

等待所有 5 份评审报告生成于 `docs/reviews/[name]/`

### Step 2: 汇总与仲裁

调用 `axiom-review-aggregator` agent：

```
Task(subagent_type="ultrapower:axiom-review-aggregator", model="sonnet", prompt="汇总以下 5 份评审意见并生成 Rough PRD：[5份评审内容]")
```

冲突仲裁优先级：安全 > 技术 > 战略 > 逻辑 > 体验

### Step 3: 用户确认门禁

展示 Rough PRD 路径，询问：
"专家评审已完成。这是最终的粗设 PRD：`docs/prd/[name]-rough.md`。是否进入任务拆解阶段？"

- **是**：调用 `/ax-decompose` skill
- **修改**：用户可要求手动修改，如需要可重跑 Step 2
- **否**：在此停止

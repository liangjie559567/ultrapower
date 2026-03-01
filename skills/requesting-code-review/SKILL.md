---
name: requesting-code-review
description: 完成任务、实施主要功能或合并前使用，以验证工作是否满足需求
---

# 请求代码审查

派遣 ultrapower:code-reviewer 子 agent 在问题扩散前捕获它们。

**核心原则：** 尽早审查，频繁审查。

## 何时请求审查

**必须：**
- subagent 驱动开发中每个任务完成后
- 完成主要功能后
- 合并到 main 前

**可选但有价值：**
- 卡住时（获取新视角）
- 重构前（基线检查）
- 修复复杂 bug 后

## 如何请求

**1. 获取 git SHA：**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 派遣 code-reviewer 子 agent：**

使用 Task 工具，类型为 ultrapower:code-reviewer，填写 `code-reviewer.md` 中的模板

**占位符：**
- `{WHAT_WAS_IMPLEMENTED}` - 刚构建的内容
- `{PLAN_OR_REQUIREMENTS}` - 应该做什么
- `{BASE_SHA}` - 起始提交
- `{HEAD_SHA}` - 结束提交
- `{DESCRIPTION}` - 简短摘要

**3. 根据反馈行动：**
- 立即修复 Critical 问题
- 继续前修复 Important 问题
- 记录 Minor 问题留待后续
- 如果审查者有误则反驳（附理由）

## 示例

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch ultrapower:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## 与工作流集成

**Subagent 驱动开发：**
- 每个任务后审查
- 在问题叠加前捕获
- 修复后再进入下一任务

**执行计划：**
- 每批（3 个任务）后审查
- 获取反馈，应用，继续

**临时开发：**
- 合并前审查
- 卡住时审查

## 红线

**绝不：**
- 因为"很简单"就跳过审查
- 忽略 Critical 问题
- 带着未修复的 Important 问题继续
- 与有效的技术反馈争论

**如果审查者有误：**
- 用技术理由反驳
- 展示证明其有效的代码/测试
- 请求澄清

模板见：requesting-code-review/code-reviewer.md

## 路由触发

审查报告返回后调用 `next-step-router`：
- current_skill: "requesting-code-review"
- stage: "review_returned"
- output_summary: 审查意见数量、严重程度分布

## Axiom 专家评审流程（增强）

当需要对 PRD 或重要功能进行全面评审时，执行并行专家评审：

### 并行专家评审（5 角色）

按优先级并行运行以下评审角色：
1. `ux-researcher`（UX Director）→ 输出 `docs/reviews/[name]/review_ux.md`
2. `product-manager`（Product Director）→ 输出 `docs/reviews/[name]/review_product.md`
3. `analyst`（Domain Expert）→ 输出 `docs/reviews/[name]/review_domain.md`
4. `architect`（Tech Lead）→ 输出 `docs/reviews/[name]/review_tech.md`
5. `critic`（Critic）→ 输出 `docs/reviews/[name]/review_critic.md`

### 汇总与冲突解决

优先级顺序：安全 > 技术 > 战略 > 逻辑 > 体验

基于优先级解决冲突，将初稿重写为最终版本。

### 用户确认门禁

展示所有评审报告路径，询问："专家评审已完成。是否进入任务拆解阶段？"

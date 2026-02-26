---
name: executing-plans
description: 当你有书面实现计划需要在独立会话中执行并设置审查检查点时使用
---

# 执行计划

## 概述

加载计划，批判性审查，分批执行任务，在批次之间报告以供审查。

**核心原则：** 分批执行，设置架构师审查检查点。

**开始时宣布：** "I'm using the executing-plans skill to implement this plan."

## 流程

### 步骤 1：加载并审查计划
1. 读取计划文件
2. 批判性审查 —— 识别对计划的任何疑问或顾虑
3. 若有顾虑：在开始前与你的人类伙伴沟通
4. 若无顾虑：创建 TodoWrite 并继续

### 步骤 2：执行批次
**默认：前 3 个任务**

对每个任务：
1. 标记为 in_progress
2. 严格按每个步骤执行（计划包含细粒度步骤）
3. 按规定运行验证
4. 标记为 completed

### 步骤 3：报告
批次完成后：
- 展示已实现的内容
- 展示验证输出
- 说："Ready for feedback."

### 步骤 4：继续
根据反馈：
- 如需要则应用变更
- 执行下一批次
- 重复直到完成

### 步骤 5：完成开发

所有任务完成并验证后：
- 宣布："I'm using the finishing-a-development-branch skill to complete this work."
- **必需子 skill：** 使用 superpowers:finishing-a-development-branch
- 遵循该 skill 验证测试、呈现选项、执行选择

## 何时停止并寻求帮助

**立即停止执行，当：**
- 批次中途遇到阻塞（缺少依赖、测试失败、指令不清晰）
- 计划存在关键缺口导致无法开始
- 你不理解某条指令
- 验证反复失败

**寻求澄清，而非猜测。**

## 何时重新审视早期步骤

**返回审查（步骤 1），当：**
- 伙伴根据你的反馈更新了计划
- 基本方案需要重新思考

**不要强行突破阻塞** —— 停下来询问。

## 注意事项
- 先批判性审查计划
- 严格按计划步骤执行
- 不跳过验证
- 计划指示时引用相关 skill
- 批次之间：仅报告并等待
- 遇到阻塞时停止，不猜测
- 未经用户明确同意，绝不在 main/master 分支上开始实现

## 集成

**必需工作流 skill：**
- **superpowers:using-git-worktrees** —— 必需：开始前设置隔离工作区
- **superpowers:writing-plans** —— 创建此 skill 执行的计划
- **superpowers:finishing-a-development-branch** —— 所有任务完成后完成开发

## 路由触发

每批次执行完毕后调用 `next-step-router`：
- current_skill: "executing-plans"
- stage: "batch_complete"
- output_summary: 本批次完成的任务数、剩余任务数

## Axiom PM→Worker 实现协议（增强）

### DAG 分析与任务分发

执行前，读取任务队列并分析依赖图：

1. **读取任务队列**：从计划文件中提取 DAG 任务表
2. **识别可并行组**：找出同一并行组（Parallel Group）中的任务
3. **最大并行度**：同时分发不超过 **3 个** Worker

### Worker 分发协议

```
PM（你）→ Worker（subagent）
  输入：Sub-PRD 路径 + 上下文文件列表
  输出：QUESTION | BLOCKED | COMPLETE
```

**三态输出处理：**
- `QUESTION`：Worker 需要澄清 → PM 回答后重新分发
- `BLOCKED`：依赖未就绪 → 将任务移入等待队列
- `COMPLETE`：任务完成 → 标记完成，解锁下游任务

### 编译门控

每批次完成后执行：
```bash
tsc --noEmit && npm run build && npm test
```
- 全部通过 → 继续下一批次
- 有失败 → 调用 `build-fixer` agent 修复后重新验证

### 报告与交接

所有任务完成后，生成报告到 `docs/reports/rd_report_[date].md`：
```markdown
## 实现报告

- 完成任务数：X / Y
- 修改文件：[列表]
- 测试覆盖率：X%
- 遗留问题：[列表]
```

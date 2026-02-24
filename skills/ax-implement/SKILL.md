---
name: ax-implement
description: "/ax-implement — Axiom 实施交付工作流：按 Manifest 顺序执行原子任务，含 CI 门禁和自动修复"
triggers: ["ax-implement", "implement feature", "开始开发", "交付流水线", "ax implement"]
---

# Axiom 实施交付工作流 (Phase 3)

本工作流按照 Manifest 清单顺序执行所有原子任务。

**开始时宣告：** "I'm using the ax-implement skill to start the implementation workflow."

## 前置条件

- Manifest 存在于 `docs/tasks/[feature-id]/manifest.md`
- 所有依赖任务已完成

## 执行步骤

### Step 1: 读取上下文

```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="read_context")
```

确认当前状态为 IDLE 或 EXECUTING。

### Step 2: 按 DAG 顺序执行任务

对每个任务 T-xxx：

1. 更新状态：`update_state(EXECUTING)`
2. 调用 executor 执行：
   ```
   Task(subagent_type="ultrapower:executor", model="sonnet", prompt="执行任务 T-xxx：[任务描述和验收条件]")
   ```
3. 检查输出格式：
   - `[COMPLETE]`：更新进度，继续下一任务
   - `[QUESTION]`：暂停，向用户询问
   - `[BLOCKED]`：触发自动修复流程

### Step 3: CI 门禁（每个任务完成后）

强制执行：
```bash
tsc --noEmit          # 零类型错误
npm run build         # 构建成功
npm test              # 测试通过
```

若 CI 失败：
- 第 1-2 次：自动修复（调用 build-fixer agent）
- 第 3 次：输出 [BLOCKED]，请求用户介入

### Step 4: 任务归档

每个任务完成后：
```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="archive_task T-xxx")
```

### Step 5: 全部完成后

1. 更新状态：`update_state(ARCHIVING)`
2. 触发进化引擎：`/ax-evolve`
3. 更新状态：`update_state(IDLE)`

## 自动修复策略

```
错误发生 → 分析根因 → 尝试修复 → 重新验证
    ↓ 失败
换方法重试 → 重新验证
    ↓ 失败
输出 [BLOCKED]
```

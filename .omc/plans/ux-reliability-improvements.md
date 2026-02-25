# UX & 可靠性改进计划

## 背景

基于头脑风暴分析，聚焦两个核心问题：
- **B1**: 不知道用哪个执行模式 → 交互式向导
- **D1**: 任务失败后状态丢失、进度不可见、原因不清晰 → 失败恢复三合一

---

## 任务列表

### Task 1: 修复 autopilot 活跃状态无法恢复的 bug

**文件**: `src/hooks/autopilot/cancel.ts`

**问题**: `canResumeAutopilot()` 在 `state.active === true` 时直接返回 `canResume: false`，
导致意外中断（进程崩溃、网络断开）的会话永远无法恢复。

**修复方案**:
- 新增 `interrupted` 状态概念：`active=true` 但超过心跳超时（默认 5 分钟）视为中断
- 中断状态允许恢复，恢复时重置 `active=true` 并记录 `resumed_at`
- 新增 `INTERRUPTED_STATE_MAX_AGE_MS = 24 * 60 * 60 * 1000`（24小时）

**伪代码**:
```
canResumeAutopilot():
  if state.active:
    age = getAutopilotStateAge()
    if age > INTERRUPTED_THRESHOLD_MS (5min):
      // 视为中断，允许恢复
      return { canResume: true, state, resumePhase: state.phase, wasInterrupted: true }
    else:
      // 可能仍在运行
      return { canResume: false }
```

**验收标准**:
- [ ] 进程崩溃后重启，`/autopilot` 能从中断阶段续跑
- [ ] 正在运行的会话不受影响（5分钟内不触发恢复）
- [ ] 单元测试覆盖中断恢复路径

---

### Task 2: 失败时输出结构化进度摘要

**文件**: `src/hooks/autopilot/cancel.ts`, `src/hooks/team-pipeline/state.ts`

**问题**: 失败时用户不知道哪些步骤完成了、哪些没完成。

**修复方案**:
- 在 `AutopilotState` 中新增 `completed_steps: string[]` 字段
- 每个阶段完成时追加到 `completed_steps`
- 失败时调用 `formatFailureSummary()` 输出结构化报告

**输出格式**:
```
[AUTOPILOT FAILED] 阶段: execution → qa 转换失败

已完成步骤:
  ✓ expansion  (2m 34s)
  ✓ planning   (1m 12s)
  ✗ execution  (中断于 ralph 第 3 次迭代)

失败原因: Failed to clear Ralph state
恢复命令: /autopilot (将从 execution 阶段续跑)
```

**验收标准**:
- [ ] 任何阶段失败都输出进度摘要
- [ ] 摘要包含已完成步骤、失败位置、恢复命令
- [ ] Team 模式失败也有类似输出

---

### Task 3: 持久化错误日志（移除 60s 限制）

**文件**: `src/features/persistent-mode/` 或新建 `src/features/error-log/`

**问题**: 工具错误状态 60 秒后过期丢弃，长运行工作流丢失错误上下文。

**修复方案**:
- 新建 `src/features/error-log/index.ts`
- 错误写入 `.omc/logs/errors.jsonl`（追加模式，每行一条 JSON）
- 保留最近 100 条，超出自动轮转
- 提供 `readRecentErrors(n)` 供 agent 查询

**数据结构**:
```json
{
  "timestamp": "2026-02-24T23:52:11Z",
  "tool_name": "Bash",
  "error": "Command failed: npm test",
  "context": { "phase": "qa", "iteration": 3 },
  "session_id": "abc123"
}
```

**验收标准**:
- [ ] 错误持久化到 `.omc/logs/errors.jsonl`
- [ ] 重启后仍可查询历史错误
- [ ] 自动轮转，不超过 100 条

---

### Task 4: 交互式向导 `/ultrapower:wizard`

**文件**: 新建 `skills/wizard/skill.md`

**功能**: 通过 3 个问题引导用户选择合适的执行模式。

**决策树**:
```
Q1: 你想做什么？
  → 新功能/构建    → Q2
  → 修复 bug      → 推荐 systematic-debugging
  → 代码审查      → 推荐 code-review
  → 重构/优化     → Q2

Q2: 任务复杂度？
  → 简单（单文件）  → 推荐 executor
  → 中等（多文件）  → Q3
  → 复杂（架构级） → 推荐 team

Q3: 需要持续运行直到完成？
  → 是            → 推荐 ralph
  → 否            → 推荐 autopilot
```

**输出格式**:
```
推荐: /ultrapower:autopilot "你的任务"

原因: 多文件功能开发，需要 plan→exec→verify 流水线，
      但不需要持续循环。

其他选项:
  - /ultrapower:ralph  如果任务可能需要多轮迭代
  - /ultrapower:team   如果需要多个 agent 并行协作
```

**验收标准**:
- [ ] 3 个问题内给出确定性推荐
- [ ] 推荐包含原因说明
- [ ] 列出备选方案

---

## 实现顺序

```
Task 3 (错误日志)  ──→  Task 2 (进度摘要，依赖错误日志)
                              ↓
Task 1 (恢复 bug)  ──→  集成测试
                              ↓
Task 4 (向导 skill) ──→  独立实现，不依赖前三个
```

**优先级**: Task 1 > Task 2 > Task 3 > Task 4

---

## 影响范围

| 文件 | 变更类型 |
|------|---------|
| `src/hooks/autopilot/cancel.ts` | 修改 `canResumeAutopilot()` |
| `src/hooks/autopilot/types.ts` | 新增 `completed_steps`, `resumed_at` 字段 |
| `src/hooks/autopilot/state.ts` | 新增 `appendCompletedStep()` |
| `src/features/error-log/index.ts` | 新建 |
| `skills/wizard/skill.md` | 新建 |
| `commands/wizard/command.json` | 新建 |

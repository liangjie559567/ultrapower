<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/todo-continuation/

## Purpose
Todo 继续执行 hook。检测 agent 响应中的待办事项列表，在执行模式下确保所有 todo 项都被完成，防止 agent 在任务未完成时停止工作。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，解析并追踪 todo 项完成状态 |

## For AI Agents

### 修改此目录时
- 参见 `src/features/continuation-enforcement/` 了解完成标准检查
- Todo 检测逻辑变更需测试各类任务场景

## Dependencies

### Internal
- `src/features/continuation-enforcement/` — 继续执行强制模块
- `src/features/boulder-state/` — 持久执行状态

<!-- MANUAL: -->

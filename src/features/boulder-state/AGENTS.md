<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/boulder-state/

## Purpose
持久执行状态（Boulder State）模块。管理 ralph/autopilot 等持久模式的"巨石不停滚"状态，确保执行在工具调用之间保持连续性。

## For AI Agents

### Boulder State 概念
- "The boulder never stops" — 持久模式下的执行不会因单次工具调用结束而停止
- 状态通过文件持久化，hook 在每次调用时检查并恢复

### 修改此目录时
- 状态格式变更需考虑向后兼容性
- 参见 `docs/standards/state-machine.md` 了解状态机规范

## Dependencies

### Internal
- `src/hooks/persistent-mode/` — 使用 boulder state
- `src/features/state-manager/` — 状态管理基础设施

<!-- MANUAL: -->

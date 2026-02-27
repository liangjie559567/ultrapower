<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/persistent-mode/

## Purpose
持久模式 hook。管理执行模式（autopilot、ralph、ultrawork 等）的持久化状态，确保模式在工具调用之间保持活跃。

## For AI Agents

### 持久模式工作原理
- Hook 在每次工具调用前检查状态文件
- 若模式处于活跃状态，注入相应的执行约束
- 模式取消通过删除状态文件实现

### 状态文件位置
- `.omc/state/{mode}-state.json`
- 使用 `state_read`/`state_write` 工具操作

### 修改此目录时
- 新增执行模式需同时更新 `src/features/mode-registry/`
- 参见 `docs/standards/state-machine.md` 了解状态机规范

## Dependencies

### Internal
- `src/features/boulder-state/` — 持久执行状态
- `src/hooks/mode-registry/` — 模式注册表

<!-- MANUAL: -->

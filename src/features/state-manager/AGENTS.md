<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/state-manager/

## Purpose
状态管理模块。提供统一的状态读写接口，管理所有执行模式的状态文件，支持会话级和全局级状态隔离。

## For AI Agents

### 状态文件路径规则
- 全局状态：`{worktree}/.omc/state/{mode}-state.json`
- 会话级状态：`{worktree}/.omc/state/sessions/{sessionId}/{mode}-state.json`
- 使用 `state_read`/`state_write` 工具操作，不要直接读写文件

### 安全规则
- `mode` 参数必须通过 `assertValidMode()` 校验
- 参见 `docs/standards/runtime-protection.md`

## Dependencies

### Internal
- `src/lib/validateMode.ts` — 模式验证（安全关键）
- `src/utils/paths.ts` — 路径工具

<!-- MANUAL: -->

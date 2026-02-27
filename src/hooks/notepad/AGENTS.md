<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/notepad/

## Purpose
Notepad hook。在工具调用前后自动同步 notepad 内容，确保优先上下文在会话中始终可用。

## For AI Agents

### 修改此目录时
- 与 `src/hooks/memory/` 协调，避免重复写入
- Notepad 格式变更需更新 `src/tools/notepad-tools.ts`

## Dependencies

### Internal
- `src/tools/notepad-tools.ts` — Notepad 工具实现
- `src/hooks/memory/` — 记忆系统 hook

<!-- MANUAL: -->

<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/memory/

## Purpose
记忆系统 hook。管理会话记忆（notepad）和项目记忆（project-memory）的自动保存和加载，确保跨会话的上下文持久化。

## For AI Agents

### 记忆层级
| 层级 | 位置 | 生命周期 |
|------|------|---------|
| 优先上下文 | `.omc/notepad.md` priority 节 | 永久（≤500字符） |
| 工作记忆 | `.omc/notepad.md` working 节 | 7天自动清理 |
| 手动记录 | `.omc/notepad.md` manual 节 | 永久 |
| 项目记忆 | `.omc/project-memory.json` | 永久 |

### 修改此目录时
- 记忆格式变更需考虑向后兼容性
- 参见 `src/tools/notepad-tools.ts` 了解 notepad 工具实现

## Dependencies

### Internal
- `src/tools/notepad-tools.ts` — Notepad 工具实现
- `src/tools/memory-tools.ts` — 记忆工具实现

<!-- MANUAL: -->

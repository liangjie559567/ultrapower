<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/beads-context/

## Purpose
Beads 上下文 hook。管理对话上下文"珠串"——将关键信息片段串联注入到 agent 上下文中，确保跨工具调用的上下文连贯性。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，注入 beads 上下文 |
| `constants.ts` | 上下文片段大小限制和优先级常量 |
| `types.ts` | Bead 数据结构类型定义 |

## For AI Agents

### 修改此目录时
- 上下文注入顺序影响 agent 行为，修改需谨慎
- 参见 `src/features/context-injector/` 了解完整上下文注入机制

## Dependencies

### Internal
- `src/features/context-injector/` — 上下文注入框架

<!-- MANUAL: -->

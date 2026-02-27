<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/pre-compact/

## Purpose
预压缩 hook。在对话上下文压缩前执行，保存关键状态信息到 notepad 和项目记忆，确保压缩后 agent 能恢复必要的工作上下文。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，触发压缩前状态保存 |

## For AI Agents

### 修改此目录时
- 保存的状态字段变更需同步更新 `src/hooks/memory/`
- 参见 `src/hooks/preemptive-compaction/` 了解主动压缩逻辑

## Dependencies

### Internal
- `src/hooks/memory/` — 记忆系统 hook
- `src/hooks/preemptive-compaction/` — 主动压缩 hook

<!-- MANUAL: -->

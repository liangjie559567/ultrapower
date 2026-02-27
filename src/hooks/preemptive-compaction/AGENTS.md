<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/preemptive-compaction/

## Purpose
主动压缩 hook。监控对话上下文大小，在接近限制前主动触发压缩流程，保存关键状态并通知用户，防止因上下文溢出导致工作丢失。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，监控上下文大小并触发压缩 |
| `constants.ts` | 压缩触发阈值常量 |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 压缩阈值变更需在大型对话场景中测试
- 参见 `src/hooks/pre-compact/` 了解压缩前状态保存

## Dependencies

### Internal
- `src/hooks/pre-compact/` — 压缩前状态保存
- `src/hooks/memory/` — 记忆系统

<!-- MANUAL: -->

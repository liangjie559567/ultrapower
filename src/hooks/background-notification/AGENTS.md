<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/background-notification/

## Purpose
后台通知 hook。在后台 agent 任务完成或发生重要事件时，通过配置的通知渠道（Discord/Telegram）向用户发送通知。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，监听后台任务事件并触发通知 |
| `types.ts` | 通知事件类型定义 |

## For AI Agents

### 修改此目录时
- 通知渠道配置参见 `src/notifications/`
- 后台任务管理参见 `src/features/background-tasks/`

## Dependencies

### Internal
- `src/notifications/` — Discord/Telegram 通知渠道
- `src/features/background-tasks/` — 后台任务调度

<!-- MANUAL: -->

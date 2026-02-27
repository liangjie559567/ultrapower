<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/notifications/

## Purpose
通知系统模块。处理 Discord、Telegram 等外部通知渠道的配置和消息发送，以及后台任务完成通知。

## For AI Agents

### 支持的通知渠道
- Discord Webhook
- Telegram Bot
- 后台任务完成通知（本地）

### 修改此目录时
- 新增通知渠道需更新 `skills/configure-discord/` 或创建新 skill
- 通知内容不得包含敏感信息（API key、用户代码等）

## Dependencies

### Internal
- `skills/configure-discord/` — Discord 配置 skill
- `skills/configure-telegram/` — Telegram 配置 skill
- `src/hooks/background-notification/` — 后台通知 hook

<!-- MANUAL: -->

---
name: configure-discord
description: 通过自然语言配置 Discord webhook/bot 通知
triggers:
  - "configure discord"
  - "setup discord"
  - "discord notifications"
  - "discord webhook"
---

# 配置 Discord 通知

设置 Discord 通知，让 OMC 在会话结束、需要输入或完成后台任务时通知你。

## 此 Skill 的工作方式

这是一个交互式自然语言配置 skill。通过 AskUserQuestion 引导用户完成设置。将结果写入 `~/.claude/.omc-config.json`。

## 步骤 1：检测现有配置

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"

if [ -f "$CONFIG_FILE" ]; then
  # Check for existing discord config
  HAS_DISCORD=$(jq -r '.notifications.discord.enabled // false' "$CONFIG_FILE" 2>/dev/null)
  HAS_DISCORD_BOT=$(jq -r '.notifications["discord-bot"].enabled // false' "$CONFIG_FILE" 2>/dev/null)
  WEBHOOK_URL=$(jq -r '.notifications.discord.webhookUrl // empty' "$CONFIG_FILE" 2>/dev/null)
  MENTION=$(jq -r '.notifications.discord.mention // empty' "$CONFIG_FILE" 2>/dev/null)

  if [ "$HAS_DISCORD" = "true" ] || [ "$HAS_DISCORD_BOT" = "true" ]; then
    echo "EXISTING_CONFIG=true"
    echo "WEBHOOK_CONFIGURED=$HAS_DISCORD"
    echo "BOT_CONFIGURED=$HAS_DISCORD_BOT"
    [ -n "$WEBHOOK_URL" ] && echo "WEBHOOK_URL=$WEBHOOK_URL"
    [ -n "$MENTION" ] && echo "MENTION=$MENTION"
  else
    echo "EXISTING_CONFIG=false"
  fi
else
  echo "NO_CONFIG_FILE"
fi
```

若找到现有配置，向用户显示当前配置并询问是否要更新或重新配置。

## 步骤 2：选择 Discord 方式

使用 AskUserQuestion：

**问题：** "How would you like to send Discord notifications?"

**选项：**
1. **Webhook（推荐）** —— 在 Discord 频道中创建 webhook。简单，无需 bot。只需粘贴 URL。
2. **Bot API** —— 使用 Discord bot token + 频道 ID。更灵活，需要 bot 应用程序。

## 步骤 3A：Webhook 设置

若用户选择 Webhook：

使用 AskUserQuestion：

**问题：** "Paste your Discord webhook URL. To create one: Server Settings > Integrations > Webhooks > New Webhook > Copy URL"

用户将在 "Other" 字段中输入 webhook URL。

**验证** URL：
- 必须以 `https://discord.com/api/webhooks/` 或 `https://discordapp.com/api/webhooks/` 开头
- 若无效，解释格式并再次询问

## 步骤 3B：Bot API 设置

若用户选择 Bot API：

询问两个问题：

1. **"Paste your Discord bot token"** —— 来自 discord.com/developers > Your App > Bot > Token
2. **"Paste the channel ID"** —— 右键点击频道 > Copy Channel ID（需要开发者模式）

## 步骤 4：配置提及（用户 Ping）

使用 AskUserQuestion：

**问题：** "Would you like notifications to mention (ping) someone?"

**选项：**
1. **Yes, mention a user** —— 通过 Discord 用户 ID 标记特定用户
2. **Yes, mention a role** —— 通过角色 ID 标记角色
3. **No mentions** —— 仅发布消息而不 ping 任何人

### 若用户想提及用户：

询问："What is the Discord user ID to mention? (Right-click user > Copy User ID, requires Developer Mode)"

The mention format is: `<@USER_ID>` (e.g., `<@1465264645320474637>`)

### 若用户想提及角色：

询问："What is the Discord role ID to mention? (Server Settings > Roles > right-click role > Copy Role ID)"

## 步骤 5：配置事件

使用带 multiSelect 的 AskUserQuestion：

**问题：** "Which events should trigger Discord notifications?"

**选项（multiSelect: true）：**
1. **Session end（推荐）** —— Claude 会话结束时
2. **Input needed** —— Claude 等待你回应时（适合长时间运行的任务）
3. **Session start** —— 新会话开始时
4. **Session continuing** —— 持久化模式保持会话活跃时

默认选择：session-end + ask-user-question。

## 步骤 6：可选用户名覆盖

使用 AskUserQuestion：

**问题：** "Custom bot display name? (Shows as the webhook sender name in Discord)"

**选项：**
1. **OMC（默认）** —— 显示为 "OMC"
2. **Claude Code** —— 显示为 "Claude Code"
3. **Custom** —— 输入自定义名称

## 步骤 7：写入配置

读取现有配置，合并新的 Discord 设置并写回：

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi
```

### For Webhook method:

Build the notifications object with the collected values and merge into `.omc-config.json` using jq:

```bash
# WEBHOOK_URL, MENTION, USERNAME are collected from user
# EVENTS is the list of enabled events

echo "$EXISTING" | jq \
  --arg url "$WEBHOOK_URL" \
  --arg mention "$MENTION" \
  --arg username "$USERNAME" \
  '.notifications = (.notifications // {enabled: true}) |
   .notifications.enabled = true |
   .notifications.discord = {
     enabled: true,
     webhookUrl: $url,
     mention: (if $mention == "" then null else $mention end),
     username: (if $username == "" then null else $username end)
   }' > "$CONFIG_FILE"
```

### For Bot API method:

```bash
echo "$EXISTING" | jq \
  --arg token "$BOT_TOKEN" \
  --arg channel "$CHANNEL_ID" \
  --arg mention "$MENTION" \
  '.notifications = (.notifications // {enabled: true}) |
   .notifications.enabled = true |
   .notifications["discord-bot"] = {
     enabled: true,
     botToken: $token,
     channelId: $channel,
     mention: (if $mention == "" then null else $mention end)
   }' > "$CONFIG_FILE"
```

### Add event-specific config if user didn't select all events:

For each event NOT selected, disable it:

```bash
# Example: disable session-start if not selected
echo "$(cat "$CONFIG_FILE")" | jq \
  '.notifications.events = (.notifications.events // {}) |
   .notifications.events["session-start"] = {enabled: false}' > "$CONFIG_FILE"
```

## 步骤 8：测试配置

写入配置后，提供发送测试通知的选项：

使用 AskUserQuestion：

**问题：** "Send a test notification to verify the setup?"

**选项：**
1. **Yes, test now（推荐）** —— 向你的 Discord 频道发送测试消息
2. **No, I'll test later** —— 跳过测试

报告成功或失败。若失败，帮助用户调试（检查 URL、权限等）。

## 步骤 9：确认

显示最终配置摘要：

```
Discord Notifications Configured!

  Method:   Webhook / Bot API
  Mention:  <@1465264645320474637> (or "none")
  Events:   session-end, ask-user-question
  Username: OMC

Config saved to: ~/.claude/.omc-config.json

You can also set these via environment variables:
  OMC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
  OMC_DISCORD_MENTION=<@1465264645320474637>

To reconfigure: /ultrapower:configure-discord
To configure Telegram: /ultrapower:configure-telegram
```

## 环境变量替代方案

用户可以通过在 shell 配置文件中设置环境变量来完全跳过此向导：

**Webhook 方式：**
```bash
export OMC_DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export OMC_DISCORD_MENTION="<@1465264645320474637>"  # optional
```

**Bot API 方式：**
```bash
export OMC_DISCORD_NOTIFIER_BOT_TOKEN="your-bot-token"
export OMC_DISCORD_NOTIFIER_CHANNEL="your-channel-id"
export OMC_DISCORD_MENTION="<@1465264645320474637>"  # optional
```

环境变量由通知系统自动检测，无需 `.omc-config.json`。

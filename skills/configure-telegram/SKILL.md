---
name: configure-telegram
description: 通过自然语言配置 Telegram bot 通知
triggers:
  - "configure telegram"
  - "setup telegram"
  - "telegram notifications"
  - "telegram bot"
---

# 配置 Telegram 通知

设置 Telegram 通知，让 OMC 在会话结束、需要输入或完成后台任务时向你发送消息。

## 此 Skill 的工作方式

这是一个交互式自然语言配置 skill。通过 AskUserQuestion 引导用户完成设置。将结果写入 `~/.claude/.omc-config.json`。

## 步骤 1：检测现有配置

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"

if [ -f "$CONFIG_FILE" ]; then
  HAS_TELEGRAM=$(jq -r '.notifications.telegram.enabled // false' "$CONFIG_FILE" 2>/dev/null)
  CHAT_ID=$(jq -r '.notifications.telegram.chatId // empty' "$CONFIG_FILE" 2>/dev/null)
  PARSE_MODE=$(jq -r '.notifications.telegram.parseMode // "Markdown"' "$CONFIG_FILE" 2>/dev/null)

  if [ "$HAS_TELEGRAM" = "true" ]; then
    echo "EXISTING_CONFIG=true"
    echo "CHAT_ID=$CHAT_ID"
    echo "PARSE_MODE=$PARSE_MODE"
  else
    echo "EXISTING_CONFIG=false"
  fi
else
  echo "NO_CONFIG_FILE"
fi
```

若找到现有配置，向用户显示当前配置并询问是否要更新或重新配置。

## 步骤 2：创建 Telegram Bot

若用户没有 bot，引导其创建：

```
To set up Telegram notifications, you need a Telegram bot token and your chat ID.

CREATE A BOT (if you don't have one):
1. Open Telegram and search for @BotFather
2. Send /newbot
3. Choose a name (e.g., "My OMC Notifier")
4. Choose a username (e.g., "my_omc_bot")
5. BotFather will give you a token like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz

GET YOUR CHAT ID:
1. Start a chat with your new bot (send /start)
2. Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
3. Look for "chat":{"id":YOUR_CHAT_ID}
   - Personal chat IDs are positive numbers (e.g., 123456789)
   - Group chat IDs are negative numbers (e.g., -1001234567890)
```

## 步骤 3：收集 Bot Token

使用 AskUserQuestion：

**问题：** "Paste your Telegram bot token (from @BotFather)"

用户将在 "Other" 字段中输入 token。

**验证** token：
- 必须匹配模式：`digits:alphanumeric`（如 `123456789:ABCdefGHI...`）
- 若无效，解释格式并再次询问

## 步骤 4：收集 Chat ID

使用 AskUserQuestion：

**问题：** "Paste your Telegram chat ID (the number from getUpdates API)"

用户将在 "Other" 字段中输入 chat ID。

**验证** chat ID：
- 必须是数字（个人为正数，群组为负数）
- 若无效，提供帮助查找：

```bash
# Help user find their chat ID
BOT_TOKEN="USER_PROVIDED_TOKEN"
echo "Fetching recent messages to find your chat ID..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" | jq '.result[-1].message.chat.id // .result[-1].message.from.id // "No messages found - send /start to your bot first"'
```

## 步骤 5：选择解析模式

使用 AskUserQuestion：

**问题：** "Which message format do you prefer?"

**选项：**
1. **Markdown（推荐）** —— 使用 Markdown 语法的粗体、斜体、代码块
2. **HTML** —— 使用 HTML 标签的粗体、斜体、代码

## 步骤 6：配置事件

使用带 multiSelect 的 AskUserQuestion：

**问题：** "Which events should trigger Telegram notifications?"

**选项（multiSelect: true）：**
1. **Session end（推荐）** —— Claude 会话结束时
2. **Input needed** —— Claude 等待你回应时（适合长时间运行的任务）
3. **Session start** —— 新会话开始时
4. **Session continuing** —— 持久化模式保持会话活跃时

默认选择：session-end + ask-user-question。

## 步骤 7：写入配置

读取现有配置，合并新的 Telegram 设置并写回：

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# BOT_TOKEN, CHAT_ID, PARSE_MODE are collected from user
echo "$EXISTING" | jq \
  --arg token "$BOT_TOKEN" \
  --arg chatId "$CHAT_ID" \
  --arg parseMode "$PARSE_MODE" \
  '.notifications = (.notifications // {enabled: true}) |
   .notifications.enabled = true |
   .notifications.telegram = {
     enabled: true,
     botToken: $token,
     chatId: $chatId,
     parseMode: $parseMode
   }' > "$CONFIG_FILE"
```

### 若用户未选择所有事件，添加事件特定配置：

对每个未选择的事件，禁用它：

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
1. **Yes, test now (Recommended)** - 向你的 Telegram 聊天发送测试消息
2. **No, I'll test later** - 跳过测试

### 若测试：

```bash
BOT_TOKEN="USER_PROVIDED_TOKEN"
CHAT_ID="USER_PROVIDED_CHAT_ID"
PARSE_MODE="Markdown"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "parse_mode=${PARSE_MODE}" \
  -d "text=OMC test notification - Telegram is configured!")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "Test notification sent successfully!"
else
  echo "Failed (HTTP $HTTP_CODE):"
  echo "$BODY" | jq -r '.description // "Unknown error"' 2>/dev/null || echo "$BODY"
fi
```

报告成功或失败。常见问题：
- **401 Unauthorized**：Bot token 无效
- **400 Bad Request: chat not found**：Chat ID 错误，或用户未向 bot 发送 `/start`
- **Network error**：检查与 api.telegram.org 的连接

## 步骤 9：确认

显示最终配置摘要：

```
Telegram Notifications Configured!

  Bot:        @your_bot_username
  Chat ID:    123456789
  Format:     Markdown
  Events:     session-end, ask-user-question

Config saved to: ~/.claude/.omc-config.json

You can also set these via environment variables:
  OMC_TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...
  OMC_TELEGRAM_CHAT_ID=123456789

To reconfigure: /ultrapower:configure-telegram
To configure Discord: /ultrapower:configure-discord
```

## 环境变量替代方案

用户可以通过在 shell 配置文件中设置环境变量来完全跳过此向导：

```bash
export OMC_TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
export OMC_TELEGRAM_CHAT_ID="123456789"
```

环境变量由通知系统自动检测，无需 `.omc-config.json`。

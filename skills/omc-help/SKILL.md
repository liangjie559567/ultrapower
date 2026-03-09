---
name: omc-help
description: ultrapower 插件使用指南
---

# OMC 工作原理

**你不需要学习任何命令！** OMC 为 Claude Code 增加了智能行为，这些行为会自动激活。

## 自动发生的事情

| 当你... | 我会自动... |
| ------------- | ------------------- |
| 给我一个复杂任务 | 并行化并委托给专业 agent |
| 让我规划某事 | 启动规划访谈 |
| 需要彻底完成某事 | 持续执行直到验证完成 |
| 处理 UI/前端工作 | 激活设计感知 |
| 说"stop"或"cancel" | 智能停止当前操作 |

## 魔法关键词（可选快捷方式）

你可以在请求中自然地包含这些词来进行显式控制：

| 关键词 | 效果 | 示例 |
| --------- | -------- | --------- |
| **ralph** | 持久化模式 | "ralph: fix all the bugs" |
| **ralplan** | 迭代规划 | "ralplan this feature" |
| **ulw** | 最大并行度 | "ulw refactor the API" |
| **plan** | 规划访谈 | "plan the new endpoints" |

**ralph 包含 ultrawork：** 激活 ralph 模式时，它会自动包含 ultrawork 的并行执行。无需组合关键词。

## 停止操作

直接说：

* "stop"

* "cancel"

* "abort"

我会根据上下文判断停止什么。

## 首次设置

如果你还没有配置 OMC：

```
/ultrapower:omc-setup
```

这是**唯一需要记住的命令**。它会下载配置，然后就完成了。

## 2.x 版本用户

你的旧命令仍然有效！`/ralph`、`/ultrawork`、`/plan` 等功能与之前完全相同。

但现在你不再**需要**它们——一切都是自动的。

---

## 使用分析

分析你的 ultrapower 使用情况，获取个性化建议以改善工作流。

> 注意：此功能替代了原来的 `/ultrapower:learn-about-omc` skill。

### 功能说明

1. 从 `~/.omc/state/token-tracking.jsonl` 读取 token 追踪数据
2. 从 `.omc/state/session-history.json` 读取会话历史
3. 分析 agent 使用模式
4. 识别未充分利用的功能
5. 推荐配置更改

### 第一步：收集数据

```bash

# 检查 token 追踪数据

TOKEN_FILE="$HOME/.omc/state/token-tracking.jsonl"
SESSION_FILE=".omc/state/session-history.json"
CONFIG_FILE="$HOME/.claude/.omc-config.json"

echo "Analyzing OMC Usage..."
echo ""

# 检查可用数据

HAS_TOKENS=false
HAS_SESSIONS=false
HAS_CONFIG=false

if [[ -f "$TOKEN_FILE" ]]; then
  HAS_TOKENS=true
  TOKEN_COUNT=$(wc -l < "$TOKEN_FILE")
  echo "Token records found: $TOKEN_COUNT"
fi

if [[ -f "$SESSION_FILE" ]]; then
  HAS_SESSIONS=true
  SESSION_COUNT=$(cat "$SESSION_FILE" | jq '.sessions | length' 2>/dev/null | | echo "0")
  echo "Sessions found: $SESSION_COUNT"
fi

if [[ -f "$CONFIG_FILE" ]]; then
  HAS_CONFIG=true
  DEFAULT_MODE=$(cat "$CONFIG_FILE" | jq -r '.defaultExecutionMode // "not set"')
  echo "Default execution mode: $DEFAULT_MODE"
fi
```

### 第二步：分析 Agent 使用情况（如有 token 数据）

```bash
if [[ "$HAS_TOKENS" == "true" ]]; then
  echo ""
  echo "TOP AGENTS BY USAGE:"
  cat "$TOKEN_FILE" | jq -r '.agentName // "main"' | sort | uniq -c | sort -rn | head -10

  echo ""
  echo "MODEL DISTRIBUTION:"
  cat "$TOKEN_FILE" | jq -r '.modelName' | sort | uniq -c | sort -rn
fi
```

### 第三步：生成建议

根据发现的模式输出建议：

**如果 Opus 使用率高（>40%）且无相应配置：**

* "考虑对常规任务使用更低级别模型以节省 token"

**如果未使用 pipeline：**

* "尝试 /pipeline 用于代码审查工作流"

**如果未使用 security-reviewer：**

* "在 auth/API 更改后使用 security-reviewer"

**如果未设置 defaultExecutionMode：**

* "在 /omc-setup 中设置 defaultExecutionMode 以获得一致行为"

### 第四步：输出报告

格式化摘要，包含：

* Token 摘要（总计、按模型分类）

* 最常用的 agent

* 未充分利用的功能

* 个性化建议

### 示例输出

```
📊 你的 OMC 使用分析

TOKEN 摘要：

* 总记录数：1,234

* 按模型：opus 45%，sonnet 40%，haiku 15%

最常用 AGENT：
1. executor（234 次）
2. architect（89 次）
3. explore（67 次）

未充分利用的功能：

* 低级别模型：0 次使用（可节省约 30% 常规任务费用）

* pipeline：0 次使用（非常适合审查工作流）

建议：
1. 设置 defaultExecutionMode 以节省 token
2. 尝试 /pipeline review 进行 PR 审查
3. 在 architect 之前使用 explore agent 以节省上下文
```

### 优雅降级

如果未找到数据：

```
📊 可用使用数据有限

未找到 token 追踪数据。要启用追踪：
1. 确保 ~/.omc/state/ 目录存在
2. 运行任意 OMC 命令开始追踪

提示：运行 /omc-setup 正确配置 OMC。
```

## 需要更多帮助？

* **README**：<https://github.com/liangjie559567/ultrapower>

* **Issues**：<https://github.com/liangjie559567/ultrapower/issues>

---

*版本：4.2.3*

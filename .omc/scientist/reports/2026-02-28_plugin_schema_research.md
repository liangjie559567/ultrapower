# Claude Code 插件 Schema 深度研究报告

**日期**: 2026-02-28
**研究阶段**: RESEARCH_STAGE:4
**目标**: 解析 plugin.json schema、hooks.json 格式、agents/*.md 格式的完整验证规则

---

## 1. plugin.json 完整 Schema

### 1.1 文件位置

```
<plugin-root>/.claude-plugin/plugin.json
```

**重要**: `.claude-plugin/` 目录只放 `plugin.json`，其他所有目录（commands/、agents/、skills/、hooks/）必须在插件根目录，不能放在 `.claude-plugin/` 内部。

### 1.2 完整 Schema 定义

```json
{
  "name": "plugin-name",           // 必填，唯一标识符，kebab-case，无空格
  "version": "1.2.0",              // 可选，语义版本
  "description": "Brief desc",    // 可选
  "author": {                      // 可选
    "name": "Author Name",
    "email": "author@example.com",
    "url": "<https://github.com/author">
  },
  "homepage": "<https://...",>       // 可选
  "repository": "<https://...",>     // 可选
  "license": "MIT",                // 可选
  "keywords": ["kw1", "kw2"],      // 可选，数组
  "commands": "./custom/cmd.md",   // 可选，string | array
  "agents": "./custom/agents/",    // 可选，string | array
  "skills": "./custom/skills/",    // 可选，string | array
  "hooks": "./config/hooks.json",  // 可选，string | array | object（内联配置）
  "mcpServers": "./mcp.json",      // 可选，string | array | object
  "outputStyles": "./styles/",     // 可选，string | array
  "lspServers": "./.lsp.json"      // 可选，string | array | object
}
```

### 1.3 关键验证规则

* `name` 是唯一必填字段（如果包含 manifest 文件）

* manifest 文件本身是可选的——省略时 Claude Code 从目录名推断插件名

* 所有路径必须是相对路径，以 `./` 开头

* 自定义路径是**补充**默认目录，不是替换

* `hooks` 字段支持三种格式：路径字符串、路径数组、内联对象

### 1.4 hooks 字段的三种合法格式

**格式 1：路径字符串**
```json
{ "hooks": "./config/hooks.json" }
```

**格式 2：路径数组**
```json
{ "hooks": ["./hooks/main.json", "./hooks/extra.json"] }
```

**格式 3：内联对象（直接嵌入 hooks 配置）**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write | Edit",
        "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh" }]
      }
    ]
  }
}
```

### 1.5 agents 字段的合法格式

```json
// 单个路径
{ "agents": "./custom/agents/reviewer.md" }

// 路径数组
{ "agents": ["./custom-agents/reviewer.md", "./custom-agents/tester.md"] }

// 目录路径
{ "agents": "./custom/agents/" }
```

---

## 2. hooks/hooks.json 格式规范

### 2.1 文件位置

默认位置：`<plugin-root>/hooks/hooks.json`

### 2.2 完整格式

```json
{
  "description": "可选的顶层描述字段",
  "hooks": {
    "<EventName>": [
      {
        "matcher": "<regex-pattern>",
        "hooks": [
          {
            "type": "command | http | prompt | agent",
            "command": "<shell-command>",
            "async": false,
            "timeout": 600,
            "statusMessage": "自定义 spinner 消息",
            "once": false
          }
        ]
      }
    ]
  }
}
```

### 2.3 与 settings.json hooks 的关系

**格式完全相同**。官方文档明确说明：

> "Copy the `hooks` object from your `.claude/settings.json` or `settings.local.json`, since the format is the same."

唯一区别：`hooks/hooks.json` 可以有可选的顶层 `description` 字段。

### 2.4 所有合法的 EventName（大小写敏感）

| 事件名 | 触发时机 |
| -------- | --------- |
| `SessionStart` | 会话开始或恢复时 |
| `UserPromptSubmit` | 用户提交 prompt 时 |
| `PreToolUse` | 工具调用前 |
| `PermissionRequest` | 权限对话框出现时 |
| `PostToolUse` | 工具调用成功后 |
| `PostToolUseFailure` | 工具调用失败后 |
| `Notification` | Claude Code 发送通知时 |
| `SubagentStart` | 子 agent 启动时 |
| `SubagentStop` | 子 agent 完成时 |
| `Stop` | Claude 完成响应时 |
| `TeammateIdle` | 团队成员即将空闲时 |
| `TaskCompleted` | 任务被标记完成时 |
| `ConfigChange` | 配置文件变更时 |
| `WorktreeCreate` | worktree 创建时 |
| `WorktreeRemove` | worktree 移除时 |
| `PreCompact` | 上下文压缩前 |
| `SessionEnd` | 会话终止时 |

### 2.5 matcher 字段规则

* 是正则表达式字符串

* 使用 `""`, `"*"` 或省略 matcher 表示匹配所有

* 不同事件类型 matcher 过滤不同字段：
  - `PreToolUse/PostToolUse/PostToolUseFailure/PermissionRequest`：过滤工具名
  - `SessionStart`：过滤启动方式（startup/resume/clear/compact）
  - `SessionEnd`：过滤结束原因
  - `SubagentStart/SubagentStop`：过滤 agent 类型名

* `UserPromptSubmit`, `Stop`, `TeammateIdle`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove` **不支持 matcher**，始终触发

### 2.6 hook handler 字段

**通用字段（所有类型）**：
| 字段 | 必填 | 说明 |
| ------ | ------ | ------ |
| `type` | 是 | `"command"`, `"http"`, `"prompt"`, `"agent"` |
| `timeout` | 否 | 超时秒数（command 默认 600，prompt 默认 30，agent 默认 60） |
| `statusMessage` | 否 | 运行时显示的 spinner 消息 |
| `once` | 否 | true 则每会话只运行一次（仅 skills，不适用 agents） |

**command 类型额外字段**：
| 字段 | 必填 | 说明 |
| ------ | ------ | ------ |
| `command` | 是 | shell 命令 |
| `async` | 否 | true 则后台运行不阻塞 |

**http 类型额外字段**：
| 字段 | 必填 | 说明 |
| ------ | ------ | ------ |
| `url` | 是 | POST 请求 URL |
| `headers` | 否 | 额外 HTTP 头 |
| `allowedEnvVars` | 否 | 允许插值的环境变量列表 |

**prompt/agent 类型额外字段**：
| 字段 | 必填 | 说明 |
| ------ | ------ | ------ |
| `prompt` | 是 | 发送给模型的 prompt，用 `$ARGUMENTS` 作为 hook 输入 JSON 的占位符 |
| `model` | 否 | 使用的模型 |

---

## 3. agents/*.md 格式规范

### 3.1 文件格式

YAML frontmatter + Markdown 正文（系统提示词）

```markdown
---
name: agent-name
description: When Claude should delegate to this subagent
tools: Read, Glob, Grep
model: sonnet
---

System prompt content here...
```

### 3.2 所有合法的 frontmatter 字段

| 字段 | 必填 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| `name` | **是** | string | 小写字母和连字符，唯一标识符 |
| `description` | **是** | string | Claude 何时委派给此 agent |
| `tools` | 否 | string（逗号分隔） | 允许的工具列表，省略则继承所有工具 |
| `disallowedTools` | 否 | string | 拒绝的工具列表 |
| `model` | 否 | string | `sonnet`, `opus`, `haiku`, `inherit`（默认 inherit） |
| `permissionMode` | 否 | string | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | 否 | number | 最大 agentic 轮次 |
| `skills` | 否 | array | 预加载到 agent 上下文的 skill 列表 |
| `mcpServers` | 否 | array/object | 可用的 MCP 服务器 |
| `hooks` | 否 | object | agent 生命周期 hooks（仅在该 agent 活跃时运行） |
| `memory` | 否 | string | `user`, `project`, `local`（持久记忆范围） |
| `background` | 否 | boolean | true 则始终作为后台任务运行 |
| `isolation` | 否 | string | `worktree`（在临时 git worktree 中运行） |

### 3.3 agent frontmatter 中的 hooks 格式

与 hooks.json 中的 `hooks` 对象格式相同：

```yaml
---
name: code-reviewer
description: Review code changes
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
  PostToolUse:
    - matcher: "Edit | Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

**注意**：agent frontmatter 中的 `Stop` hooks 在运行时自动转换为 `SubagentStop` 事件。

---

## 4. 错误 `hooks: Invalid input, agents: Invalid input` 的根因分析

### 4.1 当前 ultrapower plugin.json 状态

当前 `plugin.json` 内容（已移除 hooks 和 agents 字段）：
```json
{
  "name": "ultrapower",
  "description": "...",
  "version": "5.4.2",
  "author": { "name": "liangjie559567" },
  "homepage": "...",
  "repository": "...",
  "license": "MIT",
  "keywords": [...]
}
```

### 4.2 当前 hooks/hooks.json 状态

格式正确，使用标准的 `{ "hooks": { ... } }` 结构，所有事件名合法。

### 4.3 可能的错误来源

**假设 1：自动发现时的验证**

Claude Code 自动发现 `hooks/hooks.json` 时，会验证其内容。如果某个 hook handler 字段不合法，会报 `hooks: Invalid input`。

**假设 2：`matcher: ""` 的处理**

当前 hooks.json 中大量使用 `"matcher": ""` 空字符串。文档说明空字符串等同于匹配所有，这是合法的。但某些版本可能对空字符串有不同处理。

**假设 3：`async: false` 字段**

文档中 `async` 字段只提到 `true` 的情况（后台运行）。`async: false` 是否被验证为无效字段需要确认。

**假设 4：agents/*.md 中的 frontmatter 字段**

如果某个 agent 文件包含了不在官方 schema 中的字段，可能触发 `agents: Invalid input`。

### 4.4 需要验证的具体项目

1. `hooks/hooks.json` 中的 `"async": false` 是否合法（文档只提 `async: true`）
2. agents/*.md 中是否有非标准 frontmatter 字段
3. `"matcher": ""` 空字符串是否在所有版本中都合法
4. `TeammateIdle` 和 `TaskCompleted` 事件是否在当前 Claude Code 版本中支持（文档列出但可能是新增的）

---

## 5. 结论与建议

### 5.1 hooks/hooks.json 格式验证

当前格式基本正确。建议检查：

* 将 `"async": false` 改为省略该字段（默认就是同步）

* 确认所有事件名的大小写（`TeammateIdle` 不是 `teammateIdle`）

### 5.2 agents/*.md 格式验证

需要扫描所有 agent 文件，检查是否有非标准 frontmatter 字段。官方支持的字段列表见第 3.2 节。

### 5.3 plugin.json 路径字段

如果要在 plugin.json 中引用 hooks 或 agents，路径必须以 `./` 开头。当前 plugin.json 已移除这些字段，依赖自动发现，这是正确的做法。

---

报告生成时间：2026-02-28
数据来源：code.claude.com 官方文档（plugins、plugins-reference、sub-agents、hooks）

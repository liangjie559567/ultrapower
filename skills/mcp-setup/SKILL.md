---
name: mcp-setup
description: 为 agent 配置常用 MCP server 以增强能力
---

# MCP Setup

配置 Model Context Protocol (MCP) server，为 Claude Code 扩展外部工具能力，如网页搜索、文件系统访问和 GitHub 集成。

## 概述

MCP server 为 Claude Code agent 提供额外工具。本 skill 帮助你通过 `claude mcp add` 命令行界面配置常用 MCP server。

## 第一步：显示可用 MCP Server

使用 AskUserQuestion 向用户展示可用的 MCP server 选项：

**问题：** "您想配置哪个 MCP server？"

**选项：**
1. **Context7** - 来自主流库的文档和代码上下文
2. **Exa Web Search** - 增强网页搜索（替代内置 websearch）
3. **Filesystem** - 扩展文件系统访问能力
4. **GitHub** - GitHub API 集成，用于 issue、PR 和仓库管理
5. **Slack** - Slack 消息发送和频道管理
6. **Jira/Linear** - 项目管理和 issue 追踪
7. **PostgreSQL** - 直接查询 PostgreSQL 数据库
8. **Playwright** - 浏览器自动化和 Web 测试
9. **Sequential Thinking** - 结构化逐步推理，帮助 agent 分解复杂问题
10. **Software Planning Tool** - 任务规划与分解，提供结构化任务分析和执行追踪
11. **以上全部** - 配置所有推荐的 MCP server
12. **自定义** - 添加自定义 MCP server

## 第二步：收集所需信息

### Context7：
无需 API key，可立即使用。

### Exa Web Search：
询问 API key：
```
您有 Exa API key 吗？
- 在 https://dashboard.exa.ai 获取
- 输入您的 API key，或输入 'skip' 稍后配置
```

### Filesystem：
询问允许访问的目录：
```
filesystem MCP 应该访问哪些目录？
默认：当前工作目录
输入逗号分隔的路径，或按 Enter 使用默认值
```

### GitHub：
询问 token：
```
您有 GitHub Personal Access Token 吗？
- 在 https://github.com/settings/tokens 创建
- 推荐权限：repo, read:org
- 输入您的 token，或输入 'skip' 稍后配置
```

### Slack：
询问 Bot Token：
```
您有 Slack Bot Token 吗？
- 在 https://api.slack.com/apps 创建 App
- 需要权限：channels:read, chat:write, users:read
- 输入您的 Bot Token（xoxb-...），或输入 'skip' 稍后配置
```

### Jira/Linear：
询问使用哪个工具：
```
您使用 Jira 还是 Linear？
1. Jira - 输入 Jira URL 和 API Token
2. Linear - 输入 Linear API Key
```

对于 Jira，询问：
```
Jira 实例 URL（如 https://yourcompany.atlassian.net）：
Jira 邮箱：
Jira API Token（在 https://id.atlassian.com/manage-profile/security/api-tokens 创建）：
```

对于 Linear，询问：
```
Linear API Key（在 https://linear.app/settings/api 创建）：
```

### PostgreSQL：
询问连接信息：
```
PostgreSQL 连接信息：
- 主机（默认 localhost）：
- 端口（默认 5432）：
- 数据库名：
- 用户名：
- 密码：
或直接输入连接字符串（postgresql://user:pass@host:port/db）
```

### Playwright：
无需 API key，可立即使用。询问是否需要特定浏览器：
```
Playwright 浏览器配置：
1. Chromium（默认，推荐）
2. Firefox
3. WebKit（Safari）
```

## 第三步：使用 CLI 添加 MCP Server

使用 `claude mcp add` 命令配置每个 MCP server。CLI 会自动处理 settings.json 的更新和合并。

### Context7 配置：
```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

### Exa Web Search 配置：
```bash
claude mcp add -e EXA_API_KEY=<用户提供的key> exa -- npx -y exa-mcp-server
```

### Filesystem 配置：
```bash
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem <允许的目录>
```

### GitHub 配置：

**选项 1：Docker（本地）**
```bash
claude mcp add -e GITHUB_PERSONAL_ACCESS_TOKEN=<用户提供的token> github -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
```

**选项 2：HTTP（远程）**
```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
```

> 注意：Docker 选项需要安装 Docker。HTTP 选项更简单但功能可能有所不同。

### Slack 配置：
```bash
claude mcp add -e SLACK_BOT_TOKEN=<用户提供的token> slack -- npx -y @modelcontextprotocol/server-slack
```

### Jira 配置：
```bash
claude mcp add \
  -e JIRA_URL=<用户提供的URL> \
  -e JIRA_EMAIL=<用户提供的邮箱> \
  -e JIRA_API_TOKEN=<用户提供的token> \
  jira -- npx -y @modelcontextprotocol/server-jira
```

### Linear 配置：
```bash
claude mcp add -e LINEAR_API_KEY=<用户提供的key> linear -- npx -y @linear/mcp-server
```

### PostgreSQL 配置：
```bash
# 使用连接字符串
claude mcp add -e DATABASE_URL=<连接字符串> postgres -- npx -y @modelcontextprotocol/server-postgres

# 或使用独立参数
claude mcp add \
  -e POSTGRES_HOST=<主机> \
  -e POSTGRES_PORT=<端口> \
  -e POSTGRES_DB=<数据库名> \
  -e POSTGRES_USER=<用户名> \
  -e POSTGRES_PASSWORD=<密码> \
  postgres -- npx -y @modelcontextprotocol/server-postgres
```

### Playwright 配置：
```bash
claude mcp add playwright -- npx -y @playwright/mcp
```

### Sequential Thinking 配置：
无需 API key，可立即使用。
```bash
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

### Software Planning Tool 配置：
无需 API key，可立即使用。
```bash
claude mcp add software-planning-tool -- npx -y @modelcontextprotocol/software-planning-tool
```

## 第四步：验证安装

配置完成后，验证 MCP server 是否正确设置：

```bash
# 列出已配置的 MCP server
claude mcp list
```

这将显示所有已配置的 MCP server 及其状态。

## 第五步：显示完成消息

```
MCP Server 配置完成！

已配置的 SERVER：
[列出已配置的 server]

后续步骤：
1. 重启 Claude Code 使更改生效
2. 配置的 MCP 工具将对所有 agent 可用
3. 运行 `claude mcp list` 验证配置

使用提示：
- Context7：询问库文档（如"如何使用 React hooks？"）
- Exa：用于网页搜索（如"搜索最新 TypeScript 特性"）
- Filesystem：工作目录之外的扩展文件操作
- GitHub：与 GitHub 仓库、issue 和 PR 交互
- Slack：发送消息到频道（如"发送部署通知到 #deployments"）
- Jira/Linear：查询和创建 issue（如"查看本周待处理的 bug"）
- PostgreSQL：直接查询数据库（如"查询用户表中最近注册的 10 个用户"）
- Playwright：浏览器自动化（如"截图并测试登录流程"）
- Sequential Thinking：复杂问题逐步推理（如"分析这个架构决策的利弊"）
- Software Planning Tool：任务规划与分解（如"将这个需求拆解为可执行的子任务"）

故障排除：
- 如果 MCP server 未出现，运行 `claude mcp list` 检查状态
- 确保已安装 Node.js 18+ 以使用基于 npx 的 server
- GitHub Docker 选项需要安装并运行 Docker
- 运行 /ultrapower:omc-doctor 诊断问题

管理 MCP SERVER：
- 添加更多 server：/ultrapower:mcp-setup 或 `claude mcp add ...`
- 列出 server：`claude mcp list`
- 删除 server：`claude mcp remove <server-name>`
```

## 自定义 MCP Server

如果用户选择"自定义"：

询问：
1. Server 名称（标识符）
2. 传输类型：`stdio`（默认）或 `http`
3. stdio 方式：命令和参数（如 `npx my-mcp-server`）
4. http 方式：URL（如 `https://example.com/mcp`）
5. 环境变量（可选，key=value 格式）
6. HTTP 请求头（可选，仅 http 传输）

然后构建并运行相应的 `claude mcp add` 命令：

**stdio server：**
```bash
# 不带环境变量
claude mcp add <server-name> -- <command> [args...]

# 带环境变量
claude mcp add -e KEY1=value1 -e KEY2=value2 <server-name> -- <command> [args...]
```

**HTTP server：**
```bash
# 基本 HTTP server
claude mcp add --transport http <server-name> <url>

# 带请求头的 HTTP server
claude mcp add --transport http --header "Authorization: Bearer <token>" <server-name> <url>
```

## 常见问题

### MCP Server 未加载
- 确保已安装 Node.js 18+
- 检查 npx 是否在 PATH 中
- 运行 `claude mcp list` 验证 server 状态
- 检查 server 日志中的错误

### API Key 问题
- Exa：在 https://dashboard.exa.ai 验证 key
- GitHub：确保 token 具有所需权限（repo, read:org）
- 如需要，使用正确凭据重新运行 `claude mcp add`

### Agent 仍在使用内置工具
- 配置后重启 Claude Code
- 配置 exa 后内置 websearch 将降低优先级
- 运行 `claude mcp list` 确认 server 已激活

### 删除或更新 Server
- 删除：`claude mcp remove <server-name>`
- 更新：先删除旧 server，再用新配置重新添加

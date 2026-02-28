# ultrapower 安装部署详细教程

ultrapower v5.2.2 完整安装指南，覆盖从零开始到完全配置的所有步骤。

---

## 目录

- [前提条件](#前提条件)
- [方式一：插件市场安装（推荐）](#方式一插件市场安装推荐)
- [方式二：本地开发安装](#方式二本地开发安装)
- [方式三：npm 全局安装](#方式三npm-全局安装)
- [安装后配置](#安装后配置)
- [Axiom 系统初始化](#axiom-系统初始化)
- [MCP 服务器配置](#mcp-服务器配置)
- [验证安装](#验证安装)
- [多平台适配器](#多平台适配器)
- [更新与卸载](#更新与卸载)
- [故障排除](#故障排除)

---

## 前提条件

### 必需

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| [Claude Code](https://claude.ai/code) | 最新版 | 核心运行环境 |
| [Node.js](https://nodejs.org) | 18.0+ | JavaScript 运行时 |
| [Git](https://git-scm.com) | 2.30+ | 版本控制 |

### 可选（增强功能）

| 依赖 | 用途 |
|------|------|
| Python 3.8+ | python_repl 工具、nexus 守护进程 |
| TypeScript LSP | lsp_* 代码智能工具 |
| ast-grep | ast_grep_search/replace 工具 |

### 验证环境

```bash
# 检查 Node.js 版本
node --version   # 应显示 v18.0.0 或更高

# 检查 Claude Code
claude --version

# 检查 Git
git --version
```

---

## 方式一：插件市场安装（推荐）

这是最简单的安装方式，适合大多数用户。

### 步骤 1：添加插件市场

在 Claude Code 会话中运行：

```
/plugin marketplace add https://github.com/liangjie559567/ultrapower
```

**预期输出：**
```
✓ Marketplace added: ultrapower
  Source: https://github.com/liangjie559567/ultrapower
```

### 步骤 2：安装插件

```
/plugin install ultrapower
```

**预期输出：**
```
✓ Installing ultrapower v5.2.2...
✓ Hooks registered: 39
✓ Agents loaded: 49
✓ Skills available: 71
✓ Tools initialized: 35
Plugin installed successfully.
```

### 步骤 3：重启 Claude Code

关闭并重新打开 Claude Code，让插件完全加载。

### 步骤 4：运行安装向导

```
/ultrapower:omc-setup
```

向导会自动完成：
- 配置 hooks（PreToolUse / PostToolUse / SessionStart / Stop）
- 设置权限（避免每次工具调用弹出确认）
- 可选配置 MCP 服务器
- 可选配置 HUD 状态栏

---

## 方式二：本地开发安装

适合开发者或需要自定义修改的用户。

### 步骤 1：克隆仓库

```bash
git clone https://github.com/liangjie559567/ultrapower.git
cd ultrapower
```

### 步骤 2：安装依赖

```bash
npm install
```

### 步骤 3：构建项目

```bash
npm run build
```

**预期输出：**
```
> ultrapower@5.2.2 build
> tsc && node scripts/build-skill-bridge.mjs
✓ TypeScript compiled
✓ Skill bridge built
✓ MCP servers bundled
```

### 步骤 4：添加为本地 marketplace

```bash
# 在 Claude Code 中运行（替换为实际路径）
/plugin marketplace add /path/to/ultrapower

# Windows 示例
/plugin marketplace add C:/Users/yourname/ultrapower

# macOS/Linux 示例
/plugin marketplace add ~/projects/ultrapower
```

### 步骤 5：安装本地插件

```
/plugin install omc@ultrapower
```

### 步骤 6：开发工作流

修改代码后更新插件：

```bash
# 1. 重新构建
npm run build

# 2. 更新 marketplace 缓存
claude plugin marketplace update omc

# 3. 更新已安装插件
claude plugin update omc@ultrapower

# 4. 重启 Claude Code 会话
```

---

## 方式三：npm 全局安装

适合需要在多个项目间共享的场景。

```bash
npm install -g ultrapower
```

安装后文件会复制到：
- `~/.claude/agents/` — Agent 提示模板
- `~/.claude/commands/` — 斜杠命令
- `~/.claude/skills/` — Skills 定义

> **注意**：插件模式（方式一/二）优于 npm 全局安装，因为它使用原生 Claude Code 插件系统，路径隔离更好。

---

## 安装后配置

### 配置文件位置

主配置文件：`~/.claude/.omc-config.json`

```json
{
  "defaultExecutionMode": "ultrawork",
  "hudEnabled": true,
  "mcpServers": {
    "context7": { "enabled": true },
    "exa": { "enabled": true, "apiKey": "your-api-key" }
  }
}
```

### 执行模式配置

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `ultrawork` | 最大并行度（默认） | 复杂多文件任务 |
| `autopilot` | 全自主执行 | 明确需求的功能开发 |
| `ralph` | 持续执行直到验证通过 | 需要高质量保证的任务 |
| `team` | 多 agent 协调 | 大型项目 |

修改默认模式：

```bash
# 在 Claude Code 中
/ultrapower:wizard
```

或直接编辑配置文件：

```json
{
  "defaultExecutionMode": "autopilot"
}
```

### 权限配置

运行 omc-setup 后，`~/.claude/settings.json` 会自动添加：

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "Glob(*)",
      "Grep(*)",
      "Task(*)",
      "WebFetch(*)",
      "WebSearch(*)"
    ]
  }
}
```

---

## Axiom 系统初始化

Axiom 是 ultrapower 的自我进化引擎，需要在每个项目中单独初始化。

### 初始化

在项目目录中运行：

```
/ultrapower:ax-context init
```

这会创建以下目录结构：

```
.omc/axiom/
├── active_context.md       # 当前任务状态
├── project_decisions.md    # 架构决策记录
├── user_preferences.md     # 用户偏好
├── state_machine.md        # 状态机定义
├── reflection_log.md       # 反思日志
└── evolution/
    ├── knowledge_base.md   # 知识图谱
    ├── pattern_library.md  # 代码模式库
    ├── learning_queue.md   # 学习队列
    └── workflow_metrics.md # 工作流指标
```

### 验证 Axiom 状态

```
/ax-status
```

**预期输出：**
```
Axiom 系统状态
状态: IDLE
知识库: 0 条目
模式库: 0 个模式
学习队列: 0 待处理
工作流成功率: N/A
```

详细文档请参阅 [EVOLUTION.md](./EVOLUTION.md)。

---

## MCP 服务器配置

MCP（Model Context Protocol）服务器提供额外的 AI 能力。

### 运行配置向导

```
/ultrapower:mcp-setup
```

### 手动配置

编辑 `~/.claude/claude_desktop_config.json`（或 `.mcp.json`）：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "software-planning-tool": {
      "command": "npx",
      "args": ["-y", "software-planning-tool"]
    }
  }
}
```

### 可用 MCP 服务器

| 服务器 | 用途 | 需要 API Key |
|--------|------|-------------|
| context7 | 实时文档查询 | 否 |
| sequential-thinking | 结构化推理 | 否 |
| software-planning-tool | 任务规划分解 | 否 |
| exa | 网络搜索 | 是 |
| Codex (ask_codex) | OpenAI 代码分析 | 是 |
| Gemini (ask_gemini) | Google 大上下文分析 | 是 |

---

## 验证安装

### 完整验证流程

```bash
# 1. 检查插件状态
claude plugin list
# 应显示 ultrapower 状态为 enabled

# 2. 在 Claude Code 中验证 skills
/ultrapower:omc-help

# 3. 运行诊断
/ultrapower:omc-doctor

# 4. 检查 HUD（如已启用）
/ultrapower:hud
```

### 功能验证

在 Claude Code 中测试以下命令：

```
# 测试基础 skill
/ax-status

# 测试 agent 委派
analyze this codebase

# 测试执行模式
ultrawork: list all TypeScript files
```

### 运行测试套件（开发者）

```bash
npm test
# 预期：4589 passed, 0 failed

npm run build
# 预期：无错误

npm run lint
# 预期：0 warnings, 0 errors
```

---

## 多平台适配器

ultrapower 支持多种 AI 工具，安装后自动生成适配器文件：

| 文件 | 目标工具 | 说明 |
|------|---------|------|
| `.kiro/steering/axiom.md` | Kiro | Kiro IDE 集成 |
| `.cursorrules` | Cursor | Cursor 编辑器规则 |
| `.gemini/GEMINI.md` | Gemini CLI | Google Gemini CLI |
| `.gemini/GEMINI-CLI.md` | Gemini CLI | 详细配置 |
| `.opencode/OPENCODE.md` | OpenCode CLI | OpenCode 集成 |
| `.github/copilot-instructions.md` | GitHub Copilot | Copilot 指令 |
| `.codex/AGENTS.md` | Codex CLI | OpenAI Codex CLI |

这些文件让 ultrapower 的 Axiom 工作流在其他 AI 工具中也能使用。

---

## 更新与卸载

### 更新插件

```
/plugin update ultrapower
```

或指定版本：

```bash
# 在 Claude Code 中
/plugin install ultrapower@5.2.2
```

### 检查当前版本

```
/ultrapower:omc-help
```

### 卸载

```bash
# 卸载插件
/plugin uninstall ultrapower

# 移除 marketplace（可选）
/plugin marketplace remove omc

# 清理 Axiom 数据（可选，会删除知识库）
rm -rf .omc/axiom/
```

---

## 故障排除

### 问题：插件安装后 skills 无法调用

**症状**：`/ultrapower:ax-status` 提示未知命令

**解决**：
```bash
# 1. 确认插件已启用
claude plugin list

# 2. 重启 Claude Code

# 3. 重新运行安装向导
/ultrapower:omc-setup
```

### 问题：Windows 上缓存目录无限嵌套

**症状**：`C:\Users\<name>\.claude\plugins\marketplaces\omc` 出现多层嵌套，Claude Code 无法启动

**解决**：
```powershell
# 方法一：使用 robocopy 清空（推荐，适用于路径过深）
mkdir C:\empty_temp
robocopy C:\empty_temp "C:\Users\<name>\.claude\plugins\marketplaces\omc" /MIR
rmdir "C:\Users\<name>\.claude\plugins\marketplaces\omc" /s /q
rmdir C:\empty_temp

# 方法二：直接删除（路径不太深时）
Remove-Item -Recurse -Force "C:\Users\<name>\.claude\plugins\marketplaces\omc"
```

删除后重新安装插件，v5.2.2 已修复此问题，不会再次出现。

### 问题：hooks 未触发

**症状**：执行模式（autopilot、ralph 等）不工作

**解决**：
```bash
# 检查 hooks 配置
cat ~/.claude/settings.json | grep hooks

# 重新安装 hooks
/ultrapower:omc-setup --force
```

### 问题：LSP 工具在 Windows 上失败

**症状**：`lsp_hover`、`lsp_goto_definition` 等工具报错

**解决**：确保 Node.js 在 PATH 中，LSP 服务器需要 `.cmd` 扩展名支持（v5.2.2 已修复）。

```bash
# 验证 Node.js 可访问
node --version
which node  # Linux/macOS
where node  # Windows
```

### 问题：ax-context init 无限循环

**症状**：`/ax-context init` 反复执行无法完成

**解决**：升级到 v5.0.25+（已修复）：
```
/plugin update ultrapower
```

### 获取帮助

- **Issues**: https://github.com/liangjie559567/ultrapower/issues
- **诊断工具**: `/ultrapower:omc-doctor`
- **完整参考**: [docs/REFERENCE.md](./REFERENCE.md)
- **进化系统**: [docs/EVOLUTION.md](./EVOLUTION.md)

---

## 相关文档

- [REFERENCE.md](./REFERENCE.md) — 完整 API 参考
- [EVOLUTION.md](./EVOLUTION.md) — Axiom 自我进化系统
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 系统架构设计
- [MIGRATION.md](./MIGRATION.md) — 版本迁移指南
- [LOCAL_PLUGIN_INSTALL.md](./LOCAL_PLUGIN_INSTALL.md) — 本地开发安装

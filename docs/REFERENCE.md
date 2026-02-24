# 参考文档

ultrapower 完整参考手册。快速入门请参阅 [README.md](../README.md)。

---

## 目录

- [Installation](#installation)
- [Configuration](#configuration)
- [Agents (31 Total)](#agents-31-total)
- [Skills (54 Total)](#skills-54-total)
- [Slash Commands](#slash-commands)
- [Hooks System](#hooks-system)
- [Magic Keywords](#magic-keywords)
- [MCP Path Boundary Rules](#mcp-path-boundary-rules)
- [Platform Support](#platform-support)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)

---

## Installation

**仅支持 Claude Code Plugin 安装方式。** 其他安装方式（npm、bun、curl）已废弃，可能无法正常工作。

### Claude Code Plugin（必须）

```bash
# 第一步：添加插件市场
/plugin marketplace add https://github.com/Yeachan-Heo/ultrapower

# 第二步：安装插件
/plugin install ultrapower
```

此方式直接集成到 Claude Code 的插件系统，使用 Node.js hooks。

> **注意**：**不支持**直接通过 npm/bun 全局安装。插件系统会自动处理所有安装和 hook 配置。

### 系统要求

- 已安装 [Claude Code](https://docs.anthropic.com/claude-code)
- 以下之一：
  - **Claude Max/Pro 订阅**（推荐个人用户）
  - **Anthropic API key**（`ANTHROPIC_API_KEY` 环境变量）

---

## Configuration

### 项目级配置（推荐）

仅为当前项目配置 omc：

```
/ultrapower:omc-setup
```

- 在当前项目中创建 `./.claude/CLAUDE.md`
- 配置仅对本项目生效
- 不影响其他项目或全局设置
- **安全**：保留你的全局 CLAUDE.md

### 全局配置

为所有 Claude Code 会话配置 omc：

```
/ultrapower:omc-setup
```

- 在全局创建 `~/.claude/CLAUDE.md`
- 配置对所有项目生效
- **警告**：会完全覆盖已有的 `~/.claude/CLAUDE.md`

### 配置启用的功能

| 功能 | 未配置 | 配置 omc 后 |
|---------|---------|-----------------|
| Agent delegation | 仅手动 | 根据任务自动委派 |
| Keyword detection | 禁用 | ultrawork、search、analyze |
| Todo continuation | 基础 | 强制完成 |
| Model routing | 默认 | 智能分级选择 |
| Skill composition | 无 | 自动组合 skills |

### 配置优先级

若两种配置同时存在，**项目级配置优先于**全局配置：

```
./.claude/CLAUDE.md  (project)   →  Overrides  →  ~/.claude/CLAUDE.md  (global)
```

### 何时重新运行 Setup

- **首次使用**：安装后运行（选择项目级或全局）
- **更新后**：重新运行以获取最新配置
- **不同机器**：在每台使用 Claude Code 的机器上运行
- **新项目**：在每个需要 omc 的项目中运行 `/ultrapower:omc-setup --local`

> **注意**：通过 `npm update`、`git pull` 或 Claude Code 插件更新后，必须重新运行 `/ultrapower:omc-setup` 以应用最新的 CLAUDE.md 变更。

### Agent 自定义

编辑 `~/.claude/agents/` 中的 agent 文件以自定义行为：

```yaml
---
name: architect
description: Your custom description
tools: Read, Grep, Glob, Bash, Edit
model: opus  # or sonnet, haiku
---

Your custom system prompt here...
```

### 项目级配置文件

在项目中创建 `.claude/CLAUDE.md` 以添加项目专属说明：

```markdown
# Project Context

This is a TypeScript monorepo using:
- Bun runtime
- React for frontend
- PostgreSQL database

## Conventions
- Use functional components
- All API routes in /src/api
- Tests alongside source files
```

### Stop Callback 通知标签

使用 `omc config-stop-callback` 为 Telegram/Discord stop callbacks 配置标签。

```bash
# Set/replace tags
omc config-stop-callback telegram --enable --token <bot_token> --chat <chat_id> --tag-list "@alice,bob"
omc config-stop-callback discord --enable --webhook <url> --tag-list "@here,123456789012345678,role:987654321098765432"

# Incremental updates
omc config-stop-callback telegram --add-tag charlie
omc config-stop-callback discord --remove-tag @here
omc config-stop-callback discord --clear-tags

# Inspect current callback config
omc config-stop-callback telegram --show
omc config-stop-callback discord --show
```

标签行为：
- Telegram：`alice` 会被规范化为 `@alice`
- Discord：支持 `@here`、`@everyone`、数字用户 ID（`<@id>`）和角色标签（`role:<id>` -> `<@&id>`）
- `file` 类型的 callbacks 忽略标签选项

---

## Agents（共 31 个）

通过 Task 工具调用时，始终使用 `ultrapower:` 前缀。

### 按领域和层级分类

| 领域 | Agent | 默认模型 | 说明 |
|--------|-------|----------|------|
| **分析/规划** | `explore` | haiku | 代码库发现、符号/文件映射 |
| **分析/规划** | `analyst` | opus | 需求分析、验收标准 |
| **分析/规划** | `planner` | opus | 任务排序、执行计划 |
| **分析/规划** | `architect` | opus | 系统设计、接口、长期权衡 |
| **执行** | `debugger` | sonnet | 根因分析、回归隔离 |
| **执行** | `executor` | sonnet | 代码实现、重构、功能开发 |
| **执行** | `deep-executor` | opus | 复杂自主目标导向任务 |
| **执行** | `verifier` | sonnet | 完成证据、声明验证 |
| **代码审查** | `style-reviewer` | haiku | 格式、命名、lint 规范 |
| **代码审查** | `quality-reviewer` | sonnet | 逻辑缺陷、可维护性 |
| **代码审查** | `api-reviewer` | sonnet | API 契约、版本兼容性 |
| **代码审查** | `security-reviewer` | sonnet | 漏洞、信任边界、认证授权 |
| **代码审查** | `performance-reviewer` | sonnet | 热点、复杂度、内存/延迟 |
| **代码审查** | `code-reviewer` | opus | 跨关注点综合审查 |
| **领域专家** | `dependency-expert` | sonnet | 外部 SDK/API/包评估 |
| **领域专家** | `test-engineer` | sonnet | 测试策略、覆盖率、flaky 测试 |
| **领域专家** | `quality-strategist` | sonnet | 质量策略、发布就绪、风险评估 |
| **领域专家** | `build-fixer` | sonnet | 构建/工具链/类型错误修复 |
| **领域专家** | `designer` | sonnet | UX/UI 架构、交互设计 |
| **领域专家** | `writer` | haiku | 文档、迁移说明、用户指南 |
| **领域专家** | `qa-tester` | sonnet | 交互式 CLI/服务运行时验证 |
| **领域专家** | `scientist` | sonnet | 数据/统计分析 |
| **领域专家** | `document-specialist` | sonnet | 外部文档与参考查找 |
| **领域专家** | `git-master` | sonnet | 提交策略、历史管理 |
| **领域专家** | `vision` | sonnet | 图片/截图/图表分析 |
| **协调** | `critic` | opus | 计划/设计批判性挑战 |
| **产品** | `product-manager` | sonnet | 问题框架、PRD |
| **产品** | `ux-researcher` | sonnet | 启发式审计、可用性、无障碍 |
| **产品** | `information-architect` | sonnet | 分类、导航、可发现性 |
| **产品** | `product-analyst` | sonnet | 产品指标、漏斗分析、实验 |
| **废弃别名** | `researcher` | - | 已废弃，映射到 `document-specialist` |

### Agent 选择指南

| 任务类型 | 最佳 Agent | 模型 |
|-----------|------------|-------|
| 快速代码查找 | `explore` | haiku |
| 功能实现 | `executor` | sonnet |
| 复杂重构/自主任务 | `deep-executor` | opus |
| 调试/根因分析 | `debugger` | sonnet |
| 完成验证 | `verifier` | sonnet |
| 系统设计/架构 | `architect` | opus |
| 战略规划 | `planner` | opus |
| 需求分析 | `analyst` | opus |
| 审查/评审计划 | `critic` | opus |
| UI 组件/设计 | `designer` | sonnet |
| 编写文档/注释 | `writer` | haiku |
| 研究文档/API | `document-specialist` | sonnet |
| 分析图片/图表 | `vision` | sonnet |
| 交互式测试 CLI | `qa-tester` | sonnet |
| 安全审查 | `security-reviewer` | sonnet |
| 修复构建错误 | `build-fixer` | sonnet |
| TDD 工作流 | `test-engineer` | sonnet |
| 代码审查 | `code-reviewer` | opus |
| 数据分析/统计 | `scientist` | sonnet |
| 外部包/SDK 评估 | `dependency-expert` | sonnet |
| Git 提交/历史 | `git-master` | sonnet |
| 产品需求/PRD | `product-manager` | sonnet |
| 可用性/无障碍审计 | `ux-researcher` | sonnet |
| 信息架构 | `information-architect` | sonnet |
| 产品指标/实验 | `product-analyst` | sonnet |

---

## Skills（共 54 个）

### 核心 Skills

| Skill | 说明 | 手动命令 |
|-------|-------------|----------------|
| `orchestrate` | 多 agent 编排模式 | - |
| `autopilot` | 从想法到可运行代码的全自主执行 | `/ultrapower:autopilot` |
| `ultrawork` | 并行 agents 最大性能模式 | `/ultrapower:ultrawork` |
| `ultrapilot` | 并行 autopilot，速度提升 3-5 倍 | `/ultrapower:ultrapilot` |
| `swarm` | N 个协调 agents 并行认领任务 | `/ultrapower:swarm` |
| `pipeline` | 顺序 agent 链式执行 | `/ultrapower:pipeline` |
| `` | Token 高效并行执行 | `/ultrapower:` |
| `ralph` | 自引用开发直至完成 | `/ultrapower:ralph` |
| `ralph-init` | 初始化 PRD 以进行结构化任务跟踪 | `/ultrapower:ralph-init` |
| `ultraqa` | 自主 QA 循环工作流 | `/ultrapower:ultraqa` |
| `plan` | 启动规划会话 | `/ultrapower:plan` |
| `ralplan` | 迭代规划（Planner+Architect+Critic） | `/ultrapower:ralplan` |
| `review` | 用 critic 审查工作计划 | `/ultrapower:review` |

### 增强 Skills

| Skill | 说明 | 手动命令 |
|-------|-------------|----------------|
| `deepinit` | 分层 AGENTS.md 代码库文档化 | `/ultrapower:deepinit` |
| `deepsearch` | 多策略深度代码库搜索 | `/ultrapower:deepsearch` |
| `analyze` | 深度分析与调查 | `/ultrapower:analyze` |
| `sciomc` | 并行 scientist 编排 | `/ultrapower:sciomc` |
| `frontend-ui-ux` | 设计师转开发者的 UI/UX 专业能力 | （静默激活） |
| `git-master` | Git 专家，处理原子提交和历史管理 | （静默激活） |
| `tdd` | TDD 强制执行：测试优先开发 | `/ultrapower:tdd` |
| `learner` | 从会话中提取可复用 skill | `/ultrapower:learner` |
| `build-fix` | 修复构建和 TypeScript 错误 | `/ultrapower:build-fix` |
| `code-review` | 全面代码审查 | `/ultrapower:code-review` |
| `security-review` | 安全漏洞检测 | `/ultrapower:security-review` |

### 工具 Skills

| Skill | 说明 | 手动命令 |
|-------|-------------|----------------|
| `note` | 保存笔记到抗压缩 notepad | `/ultrapower:note` |
| `cancel` | 统一取消所有模式 | `/ultrapower:cancel` |
| `omc-setup` | 一次性安装向导 | `/ultrapower:omc-setup` |
| `omc-doctor` | 诊断并修复安装问题 | `/ultrapower:omc-doctor` |
| `omc-help` | 显示 OMC 使用指南 | `/ultrapower:omc-help` |
| `hud` | 配置 HUD 状态栏 | `/ultrapower:hud` |
| `release` | 自动化发布工作流 | `/ultrapower:release` |
| `mcp-setup` | 配置 MCP 服务器 | `/ultrapower:mcp-setup` |
| `writer-memory` | 面向写作者的 agent 记忆系统 | `/ultrapower:writer-memory` |
| `project-session-manager` | 管理隔离开发环境（git worktrees + tmux） | `/ultrapower:project-session-manager` |
| `skill` | 管理本地 skills（列出、添加、删除、搜索、编辑） | `/ultrapower:skill` |

---

## Slash Commands

所有 skills 均可通过 `/ultrapower:` 前缀作为 slash 命令使用。

| 命令 | 说明 |
|---------|-------------|
| `/ultrapower:orchestrate <task>` | 激活多 agent 编排模式 |
| `/ultrapower:autopilot <task>` | 全自主执行 |
| `/ultrapower:ultrawork <task>` | 并行 agents 最大性能模式 |
| `/ultrapower:ultrapilot <task>` | 并行 autopilot（速度提升 3-5 倍） |
| `/ultrapower:swarm <N>:<agent> <task>` | 协调 agent 集群 |
| `/ultrapower:pipeline <stages>` | 顺序 agent 链式执行 |
| `/ultrapower: <task>` | Token 高效并行执行 |
| `/ultrapower:ralph-init <task>` | 初始化 PRD 以进行结构化任务跟踪 |
| `/ultrapower:ralph <task>` | 自引用循环直至任务完成 |
| `/ultrapower:ultraqa <goal>` | 自主 QA 循环工作流 |
| `/ultrapower:plan <description>` | 启动规划会话 |
| `/ultrapower:ralplan <description>` | 共识迭代规划 |
| `/ultrapower:review [plan-path]` | 用 critic 审查计划 |
| `/ultrapower:deepsearch <query>` | 多策略深度代码库搜索 |
| `/ultrapower:deepinit [path]` | 用分层 AGENTS.md 文件索引代码库 |
| `/ultrapower:analyze <target>` | 深度分析与调查 |
| `/ultrapower:sciomc <topic>` | 并行研究编排 |
| `/ultrapower:tdd <feature>` | TDD 工作流强制执行 |
| `/ultrapower:learner` | 从会话中提取可复用 skill |
| `/ultrapower:note <content>` | 保存笔记到 notepad.md |
| `/ultrapower:cancel` | 统一取消 |
| `/ultrapower:omc-setup` | 一次性安装向导 |
| `/ultrapower:omc-doctor` | 诊断并修复安装问题 |
| `/ultrapower:omc-help` | 显示 OMC 使用指南 |
| `/ultrapower:hud` | 配置 HUD 状态栏 |
| `/ultrapower:release` | 自动化发布工作流 |
| `/ultrapower:mcp-setup` | 配置 MCP 服务器 |

---

## Hooks System

ultrapower 包含 34 个生命周期 hooks，用于增强 Claude Code 的行为。

### 执行模式 Hooks

| Hook | 说明 |
|------|-------------|
| `autopilot` | 从想法到可运行代码的全自主执行 |
| `ultrawork` | 最大并行 agent 执行 |
| `ralph` | 持续执行直至验证完成 |
| `ultrapilot` | 带文件所有权的并行 autopilot |
| `ultraqa` | QA 循环直至目标达成 |
| `swarm` | 基于 SQLite 任务认领的协调多 agent |
| `mode-registry` | 跟踪当前执行模式（含 ） |
| `persistent-mode` | 跨会话维护模式状态 |

### 核心 Hooks

| Hook | 说明 |
|------|-------------|
| `rules-injector` | 动态规则注入，支持 YAML frontmatter 解析 |
| `omc-orchestrator` | 强制执行编排器行为和委派 |
| `auto-slash-command` | 自动检测并执行 slash 命令 |
| `keyword-detector` | Magic keyword 检测（ultrawork、ralph 等） |
| `todo-continuation` | 确保 todo 列表完成 |
| `notepad` | 抗压缩记忆系统 |
| `learner` | 从对话中提取 skill |

### 上下文与恢复 Hooks

| Hook | 说明 |
|------|-------------|
| `recovery` | 编辑错误、会话和上下文窗口恢复 |
| `preemptive-compaction` | 监控上下文使用量以防止超限 |
| `pre-compact` | 压缩前处理 |
| `directory-readme-injector` | README 上下文注入 |

### 质量与验证 Hooks

| Hook | 说明 |
|------|-------------|
| `comment-checker` | BDD 检测和指令过滤 |
| `thinking-block-validator` | 扩展思考验证 |
| `empty-message-sanitizer` | 空消息处理 |
| `permission-handler` | 权限请求与验证 |
| `think-mode` | 扩展思考检测 |

### 协调与环境 Hooks

| Hook | 说明 |
|------|-------------|
| `subagent-tracker` | 跟踪已生成的子 agents |
| `session-end` | 会话终止处理 |
| `non-interactive-env` | CI/非交互式环境处理 |
| `agent-usage-reminder` | 提醒使用专业 agents |
| `background-notification` | 后台任务完成通知 |
| `plugin-patterns` | 插件模式检测 |
| `setup` | 初始安装与配置 |

---

## Magic Keywords

在提示词中任意位置包含以下关键词即可激活增强模式：

| 关键词 | 效果 |
|---------|--------|
| `ultrawork`, `ulw`, `uw` | 激活并行 agent 编排 |
| ``, `eco`, `efficient`, `save-tokens`, `budget` | Token 高效并行执行 |
| `autopilot`, `build me`, `I want a` | 全自主执行 |
| `ultrapilot`, `parallel build`, `swarm build` | 并行 autopilot（速度提升 3-5 倍） |
| `ralph`, `don't stop`, `must complete` | 持续执行直至验证完成 |
| `plan this`, `plan the` | 规划访谈工作流 |
| `ralplan` | 迭代规划共识 |
| `search`, `find`, `locate` | 增强搜索模式 |
| `analyze`, `investigate`, `debug` | 深度分析模式 |
| `sciomc` | 并行研究编排 |
| `tdd`, `test first`, `red green` | TDD 工作流强制执行 |
| `swarm N agents` | 协调 agent 集群 |
| `pipeline`, `chain agents` | 顺序 agent 链式执行 |
| `stop`, `cancel`, `abort` | 统一取消 |

### 示例

```bash
# 在 Claude Code 中：

# 最大并行度
ultrawork implement user authentication with OAuth

# Token 高效并行
eco fix all TypeScript errors

# 增强搜索
find all files that import the utils module

# 深度分析
analyze why the tests are failing

# 自主执行
autopilot: build a todo app with React

# 并行 autopilot
ultrapilot: build a fullstack todo app

# 持续执行模式
ralph: refactor the authentication module

# 规划会话
plan this feature

# TDD 工作流
tdd: implement password validation

# 协调集群
swarm 5 agents: fix all lint errors

# Agent 链式执行
pipeline: analyze → fix → test this bug
```

---

## MCP Path Boundary Rules

MCP 工具（`ask_codex`、`ask_gemini`）出于安全考虑强制执行严格的路径边界。`prompt_file` 和 `output_file` 均相对于 `working_directory` 解析。

### 默认行为（严格模式）

默认情况下，两个文件都必须位于 `working_directory` 内：

| 参数 | 要求 |
|-----------|-------------|
| `prompt_file` | 必须位于 `working_directory` 内（符号链接解析后） |
| `output_file` | 必须位于 `working_directory` 内（符号链接解析后） |
| `working_directory` | 必须位于项目 worktree 内（除非绕过） |

### 环境变量覆盖

| 变量 | 取值 | 说明 |
|----------|--------|-------------|
| `OMC_MCP_OUTPUT_PATH_POLICY` | `strict`（默认）、`redirect_output` | 控制输出文件路径强制策略 |
| `OMC_MCP_OUTPUT_REDIRECT_DIR` | 路径（默认：`.omc/outputs`） | 策略为 `redirect_output` 时的重定向目录 |
| `OMC_MCP_ALLOW_EXTERNAL_PROMPT` | `0`（默认）、`1` | 允许 prompt 文件位于 working directory 之外 |
| `OMC_ALLOW_EXTERNAL_WORKDIR` | 未设置（默认）、`1` | 允许 working_directory 位于项目 worktree 之外 |
| `OMC_DISCORD_WEBHOOK_URL` | URL | Discord webhook URL，用于通知 |
| `OMC_DISCORD_NOTIFIER_BOT_TOKEN` | Token | Discord bot token，用于 Bot API 通知 |
| `OMC_DISCORD_NOTIFIER_CHANNEL` | Channel ID | Discord 频道 ID，用于 Bot API 通知 |
| `OMC_DISCORD_MENTION` | `<@uid>` 或 `<@&role_id>` | 在 Discord 消息前添加的 mention |
| `OMC_TELEGRAM_BOT_TOKEN` | Token | Telegram bot token，用于通知 |
| `OMC_TELEGRAM_CHAT_ID` | Chat ID | Telegram chat ID，用于通知 |
| `OMC_SLACK_WEBHOOK_URL` | URL | Slack incoming webhook URL，用于通知 |

### 策略说明

**`OMC_MCP_OUTPUT_PATH_POLICY=strict`（默认）**
- 输出文件必须位于 `working_directory` 内
- 尝试写入边界外的文件将失败，错误码为 `E_PATH_OUTSIDE_WORKDIR_OUTPUT`
- 最安全的选项——推荐用于生产环境

**`OMC_MCP_OUTPUT_PATH_POLICY=redirect_output`**
- 输出文件自动重定向到 `OMC_MCP_OUTPUT_REDIRECT_DIR`
- 仅保留文件名，目录结构被展平
- 适用于希望将所有输出集中到一个位置的场景
- 在 `[MCP Config]` 级别记录重定向日志

**`OMC_MCP_ALLOW_EXTERNAL_PROMPT=1`**
- 允许从 `working_directory` 外部读取 prompt 文件
- **安全警告**：允许读取文件系统上的任意文件
- 仅在可信环境中使用

**`OMC_ALLOW_EXTERNAL_WORKDIR=1`**
- 允许 `working_directory` 位于项目 worktree 之外
- 绕过 worktree 边界检查
- 适用于对外部项目运行 MCP 工具的场景

### 错误码

| 错误码 | 含义 |
|-------|---------|
| `E_PATH_OUTSIDE_WORKDIR_PROMPT` | prompt_file 位于 working_directory 之外 |
| `E_PATH_OUTSIDE_WORKDIR_OUTPUT` | output_file 位于 working_directory 之外 |
| `E_PATH_RESOLUTION_FAILED` | 符号链接或目录解析失败 |
| `E_WRITE_FAILED` | 输出文件写入失败（I/O 错误） |
| `E_WORKDIR_INVALID` | working_directory 不存在或无法访问 |

### 有效/无效路径示例

**有效路径（working_directory: `/home/user/project`）**
```
prompt.txt                    -> /home/user/project/prompt.txt
./prompts/task.md             -> /home/user/project/prompts/task.md
../project/output.txt         -> /home/user/project/output.txt (resolves inside)
.omc/outputs/response.md      -> /home/user/project/.omc/outputs/response.md
```

**无效路径（working_directory: `/home/user/project`）**
```
/etc/passwd                   -> Outside working directory (absolute)
../../etc/shadow              -> Outside working directory (traverses too far)
/tmp/output.txt               -> Outside working directory (different root)
```

### 故障排查矩阵

| 现象 | 原因 | 解决方法 |
|---------|-------|-----|
| `E_PATH_OUTSIDE_WORKDIR_PROMPT` 错误 | prompt_file 位于 working_directory 之外 | 将文件移至 working directory，或将 working_directory 改为公共父目录 |
| `E_PATH_OUTSIDE_WORKDIR_OUTPUT` 错误 | output_file 位于 working_directory 之外 | 使用 working directory 内的相对路径，或设置 `OMC_MCP_OUTPUT_PATH_POLICY=redirect_output` |
| `E_PATH_RESOLUTION_FAILED` 错误 | 符号链接解析失败或目录不可访问 | 确保目标目录存在且可访问 |
| `E_WRITE_FAILED` 错误 | I/O 错误（权限不足、磁盘已满） | 检查文件权限和磁盘空间 |
| `working_directory is outside the project worktree` | working_directory 不在 git worktree 内 | 设置 `OMC_ALLOW_EXTERNAL_WORKDIR=1`，或使用项目内的 working directory |
| 输出文件不在预期位置 | `redirect_output` 策略已激活 | 检查 `OMC_MCP_OUTPUT_REDIRECT_DIR`（默认：`.omc/outputs`） |

---

## Platform Support

### 操作系统

| 平台 | 安装方式 | Hook 类型 |
|----------|---------------|-----------|
| **Windows** | `npm install -g` | Node.js (.mjs) |
| **macOS** | curl 或 npm | Bash (.sh) |
| **Linux** | curl 或 npm | Bash (.sh) |

> **注意**：Bash hooks 在 macOS 和 Linux 上完全可移植（无 GNU 特定依赖）。

> **高级**：设置 `OMC_USE_NODE_HOOKS=1` 可在 macOS/Linux 上使用 Node.js hooks。

### 可用工具

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| **Read** | ✅ 可用 | 读取文件 |
| **Write** | ✅ 可用 | 创建文件 |
| **Edit** | ✅ 可用 | 修改文件 |
| **Bash** | ✅ 可用 | 运行 shell 命令 |
| **Glob** | ✅ 可用 | 按模式查找文件 |
| **Grep** | ✅ 可用 | 搜索文件内容 |
| **WebSearch** | ✅ 可用 | 搜索网络 |
| **WebFetch** | ✅ 可用 | 获取网页内容 |
| **Task** | ✅ 可用 | 生成子 agents |
| **TodoWrite** | ✅ 可用 | 跟踪任务 |

### LSP 工具（真实实现）

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| `lsp_hover` | ✅ 已实现 | 获取指定位置的类型信息和文档 |
| `lsp_goto_definition` | ✅ 已实现 | 跳转到符号定义 |
| `lsp_find_references` | ✅ 已实现 | 查找符号的所有引用 |
| `lsp_document_symbols` | ✅ 已实现 | 获取文件大纲（函数、类等） |
| `lsp_workspace_symbols` | ✅ 已实现 | 在工作区内搜索符号 |
| `lsp_diagnostics` | ✅ 已实现 | 获取错误、警告和提示 |
| `lsp_prepare_rename` | ✅ 已实现 | 检查重命名是否有效 |
| `lsp_rename` | ✅ 已实现 | 在整个项目中重命名符号 |
| `lsp_code_actions` | ✅ 已实现 | 获取可用的重构操作 |
| `lsp_code_action_resolve` | ✅ 已实现 | 获取代码操作的详细信息 |
| `lsp_servers` | ✅ 已实现 | 列出可用的语言服务器 |
| `lsp_diagnostics_directory` | ✅ 已实现 | 项目级类型检查 |

> **注意**：LSP 工具需要安装语言服务器（typescript-language-server、pylsp、rust-analyzer、gopls 等）。使用 `lsp_servers` 检查安装状态。

### AST 工具（ast-grep 集成）

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| `ast_grep_search` | ✅ 已实现 | 基于 AST 匹配的模式代码搜索 |
| `ast_grep_replace` | ✅ 已实现 | 基于模式的代码转换 |

> **注意**：AST 工具使用 [@ast-grep/napi](https://ast-grep.github.io/) 进行结构化代码匹配。支持元变量，如 `$VAR`（单节点）和 `$$$`（多节点）。

---

## Performance Monitoring

ultrapower 包含全面的 agent 性能、token 使用量监控及并行工作流调试功能。

完整文档请参阅 **[Performance Monitoring Guide](./PERFORMANCE-MONITORING.md)**。

### 快速概览

| 功能 | 说明 | 访问方式 |
|---------|-------------|--------|
| **Agent Observatory** | 实时 agent 状态、效率、瓶颈 | HUD / API |
| **Token Analytics** | 成本跟踪、使用报告、预算警告 | `omc stats`, `omc cost` |
| **Session Replay** | 会话后分析的事件时间线 | `.omc/state/agent-replay-*.jsonl` |
| **Intervention System** | 自动检测停滞 agents 和成本超支 | 自动 |

### CLI 命令

CLI 入口：`ultrapower`、`omc`、`omc-cli`（三者等价）。

```bash
omc stats          # 当前会话统计
omc cost daily     # 每日成本报告
omc cost weekly    # 每周成本报告
omc sessions       # 列出会话记录
omc agents         # Agent 明细
omc export         # 导出数据
omc cleanup        # 清理旧数据
omc backfill       # 导入历史记录数据
omc wait           # 等待后台任务完成
omc config-stop-callback  # 配置 stop callback 通知标签
```

分析工具：`omc-analytics`（独立分析命令）。

### HUD Analytics 预设

在状态栏中启用详细成本跟踪：

```json
{
  "omcHud": {
    "preset": "analytics"
  }
}
```

### 外部资源

- **[MarginLab.ai](https://marginlab.ai)** - 带统计显著性检验的 SWE-Bench-Pro 性能跟踪，用于检测 Claude 模型退化

---

## Troubleshooting

### 诊断安装问题

```bash
/ultrapower:omc-doctor
```

检查项目：
- 缺失的依赖
- 配置错误
- Hook 安装状态
- Agent 可用性
- Skill 注册情况

### 配置 HUD 状态栏

```bash
/ultrapower:hud setup
```

安装或修复 HUD 状态栏以获取实时状态更新。

### HUD 配置（settings.json）

在 `~/.claude/settings.json` 中配置 HUD 元素：

```json
{
  "omcHud": {
    "preset": "focused",
    "elements": {
      "cwd": true,
      "gitRepo": true,
      "gitBranch": true
    }
  }
}
```

| 元素 | 说明 | 默认值 |
|---------|-------------|---------|
| `cwd` | 显示当前工作目录 | `false` |
| `gitRepo` | 显示 git 仓库名称 | `false` |
| `gitBranch` | 显示当前 git 分支 | `false` |
| `omcLabel` | 显示 [OMC] 标签 | `true` |
| `contextBar` | 显示上下文窗口使用量 | `true` |
| `agents` | 显示活跃 agents 数量 | `true` |
| `todos` | 显示 todo 进度 | `true` |
| `ralph` | 显示 ralph 循环状态 | `true` |
| `autopilot` | 显示 autopilot 状态 | `true` |

可用预设：`minimal`、`focused`、`full`、`dense`、`analytics`、`opencode`

### 常见问题

| 问题 | 解决方法 |
|-------|----------|
| 命令未找到 | 重新运行 `/ultrapower:omc-setup` |
| Hooks 未执行 | 检查 hook 权限：`chmod +x ~/.claude/hooks/**/*.sh` |
| Agents 未委派 | 验证 CLAUDE.md 已加载：检查 `./.claude/CLAUDE.md` 或 `~/.claude/CLAUDE.md` |
| LSP 工具不工作 | 安装语言服务器：`npm install -g typescript-language-server` |
| Token 限制错误 | 使用 `/ultrapower:` 进行 token 高效执行 |

### 自动更新

Oh-my-claudecode 包含一个静默自动更新系统，在后台检查更新。

特性：
- **频率限制**：最多每 24 小时检查一次
- **并发安全**：锁文件防止同时更新
- **跨平台**：在 macOS 和 Linux 上均可工作

如需手动更新，重新运行插件安装命令或使用 Claude Code 内置的更新机制。

### 卸载

```bash
curl -fsSL https://raw.githubusercontent.com/Yeachan-Heo/ultrapower/main/scripts/uninstall.sh | bash
```

Or manually:

```bash
rm ~/.claude/agents/{architect,document-specialist,explore,designer,writer,vision,critic,analyst,executor,qa-tester}.md
rm ~/.claude/commands/{analyze,autopilot,deepsearch,plan,review,ultrawork}.md
```

---

## Changelog

版本历史和发布说明请参阅 [CHANGELOG.md](../CHANGELOG.md)。

---

## License

MIT - 参见 [LICENSE](../LICENSE)

## Credits

灵感来源于 code-yeongyu 的 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)。

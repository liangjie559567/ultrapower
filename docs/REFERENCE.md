# 参考文档

ultrapower 完整参考手册。快速入门请参阅 [README.md](../README.md)。

---

## 目录

- [Installation](#installation)
- [Configuration](#configuration)
- [Agents (49 Total)](#agents-49-total)
- [Skills (71 Total)](#skills-71-total)
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
/plugin marketplace add https://github.com/liangjie559567/ultrapower

# 第二步：安装插件
/plugin install omc@ultrapower
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

### 权限配置（步骤 3.75）

omc-setup 包含一个权限配置步骤，自动将常用工具权限写入 `~/.claude/settings.json`：

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

此步骤避免每次工具调用时弹出权限确认对话框，提升工作流流畅度。如需跳过，在 setup 过程中选择"跳过"即可。

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

## Agents（49 Total）

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
| **领域专家** | `database-expert` | sonnet | 数据库设计、查询优化和迁移 |
| **领域专家** | `devops-engineer` | sonnet | CI/CD、容器化、基础设施即代码 |
| **领域专家** | `i18n-specialist` | sonnet | 国际化、本地化和多语言支持 |
| **领域专家** | `accessibility-auditor` | sonnet | Web 无障碍审查和 WCAG 合规 |
| **领域专家** | `api-designer` | sonnet | REST/GraphQL API 设计和契约定义 |
| **协调** | `critic` | opus | 计划/设计批判性挑战 |
| **产品** | `product-manager` | sonnet | 问题框架、PRD |
| **产品** | `ux-researcher` | sonnet | 启发式审计、可用性、无障碍 |
| **产品** | `information-architect` | sonnet | 分类、导航、可发现性 |
| **产品** | `product-analyst` | sonnet | 产品指标、漏斗分析、实验 |
| **废弃别名** | `researcher` | - | 已废弃，映射到 `document-specialist` |
| **废弃别名** | `tdd-guide` | - | 已废弃，映射到 `test-engineer` |
| **Axiom** | `axiom-requirement-analyst` | sonnet | 需求分析三态门（PASS/CLARIFY/REJECT） |
| **Axiom** | `axiom-product-designer` | sonnet | Draft PRD 生成，含 Mermaid 流程图 |
| **Axiom** | `axiom-review-aggregator` | sonnet | 5 专家并行审查聚合与冲突仲裁 |
| **Axiom** | `axiom-prd-crafter` | sonnet | 工程级 PRD，含门控验证 |
| **Axiom** | `axiom-system-architect` | sonnet | 原子任务 DAG 与 Manifest 生成 |
| **Axiom** | `axiom-evolution-engine` | sonnet | 知识收割、模式检测、工作流优化 |
| **Axiom** | `axiom-context-manager` | sonnet | 7 操作记忆系统（读/写/状态/检查点） |
| **Axiom** | `axiom-worker` | sonnet | PM→Worker 协议，三态输出（QUESTION/COMPLETE/BLOCKED） |
| **Axiom 专家** | `axiom-ux-director` | sonnet | UX/体验专家评审，输出 review_ux.md |
| **Axiom 专家** | `axiom-product-director` | sonnet | 产品战略专家评审，输出 review_product.md |
| **Axiom 专家** | `axiom-domain-expert` | sonnet | 领域知识专家评审，输出 review_domain.md |
| **Axiom 专家** | `axiom-tech-lead` | sonnet | 技术可行性评审，输出 review_tech.md |
| **Axiom 专家** | `axiom-critic` | sonnet | 安全/质量/逻辑评审，输出 review_critic.md |
| **Axiom 专家** | `axiom-sub-prd-writer` | sonnet | 将 Manifest 任务拆解为可执行 Sub-PRD |

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

## Skills（共 71 个）

### 核心 Skills

| Skill | 说明 | 手动命令 |
|-------|-------------|----------------|
| `autopilot` | 从想法到可运行代码的全自主执行 | `/ultrapower:autopilot` |
| `ultrawork` | 并行 agents 最大性能模式 | `/ultrapower:ultrawork` |
| `ultrapilot` | 并行 autopilot，速度提升 3-5 倍 | `/ultrapower:ultrapilot` |
| `swarm` | N 个协调 agents 并行认领任务 | `/ultrapower:swarm` |
| `team` | N 个协调 agents 使用 Claude Code 原生 team | `/ultrapower:team` |
| `pipeline` | 顺序 agent 链式执行 | `/ultrapower:pipeline` |
| `ralph` | 自引用开发直至完成 | `/ultrapower:ralph` |
| `ralph-init` | 初始化 PRD 以进行结构化任务跟踪 | `/ultrapower:ralph-init` |
| `ultraqa` | 自主 QA 循环工作流 | `/ultrapower:ultraqa` |
| `plan` | 启动规划会话 | `/ultrapower:plan` |
| `ralplan` | 迭代规划（Planner+Architect+Critic） | `/ultrapower:ralplan` |
| `review` | 用 critic 审查工作计划 | `/ultrapower:review` |

### 工作流 Skills

| Skill | 说明 | 手动命令 |
|-------|-------------|----------------|
| `brainstorming` | 实现前探索需求和设计方案 | `/ultrapower:brainstorming` |
| `writing-plans` | 将需求拆解为原子任务计划 | `/ultrapower:writing-plans` |
| `subagent-driven-development` | 当前 session 中执行独立任务 | `/ultrapower:subagent-driven-development` |
| `executing-plans` | 在独立 session 中执行计划 | `/ultrapower:executing-plans` |
| `test-driven-development` | TDD 强制执行：测试优先开发 | `/ultrapower:test-driven-development` |
| `systematic-debugging` | 系统化调试工作流 | `/ultrapower:systematic-debugging` |
| `requesting-code-review` | 完成任务后请求代码审查 | `/ultrapower:requesting-code-review` |
| `receiving-code-review` | 接收并处理代码审查反馈 | `/ultrapower:receiving-code-review` |
| `finishing-a-development-branch` | 完成开发分支并整合工作 | `/ultrapower:finishing-a-development-branch` |
| `using-git-worktrees` | 创建隔离 git worktree 工作区 | `/ultrapower:using-git-worktrees` |
| `verification-before-completion` | 声明完成前运行验证 | `/ultrapower:verification-before-completion` |
| `using-superpowers` | 建立 skill 使用规则 | `/ultrapower:using-superpowers` |
| `dispatching-parallel-agents` | 并行分发独立任务给多个 agents | `/ultrapower:dispatching-parallel-agents` |

### 增强 Skills

| Skill | 说明 | 手动命令 |
|-------|-------------|----------------|
| `next-step-router` | 关键节点路由，推荐最优下一步 skill/agent | （内部调用） |
| `deepinit` | 分层 AGENTS.md 代码库文档化 | `/ultrapower:deepinit` |
| `deepsearch` | 多策略深度代码库搜索 | `/ultrapower:deepsearch` |
| `analyze` | 深度分析与调查 | `/ultrapower:analyze` |
| `sciomc` | 并行 scientist 编排 | `/ultrapower:sciomc` |
| `external-context` | 并行 document-specialist 网络搜索 | `/ultrapower:external-context` |
| `ccg` | Claude-Codex-Gemini 三模型并行编排 | `/ultrapower:ccg` |
| `frontend-ui-ux` | 设计师转开发者的 UI/UX 专业能力 | （静默激活） |
| `git-master` | Git 专家，处理原子提交和历史管理 | （静默激活） |
| `tdd` | TDD 强制执行（`test-driven-development` 别名） | `/ultrapower:tdd` |
| `learner` | 从会话中提取可复用 skill | `/ultrapower:learner` |
| `build-fix` | 修复构建和 TypeScript 错误 | `/ultrapower:build-fix` |
| `code-review` | 全面代码审查 | `/ultrapower:code-review` |
| `security-review` | 安全漏洞检测 | `/ultrapower:security-review` |
| `trace` | 显示 agent 流程追踪时间线 | `/ultrapower:trace` |
| `learn-about-omc` | 了解 OMC 使用模式并获取建议 | `/ultrapower:learn-about-omc` |
| `writing-skills` | 创建/编辑/验证 skills | `/ultrapower:writing-skills` |

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
| `psm` | project-session-manager 别名 | `/ultrapower:psm` |
| `skill` | 管理本地 skills（列出、添加、删除、搜索、编辑） | `/ultrapower:skill` |
| `configure-discord` | 配置 Discord webhook/bot 通知 | `/ultrapower:configure-discord` |
| `configure-telegram` | 配置 Telegram bot 通知 | `/ultrapower:configure-telegram` |
| `wizard` | 交互式配置向导 | `/ultrapower:wizard` |
| `nexus` | 主动学习系统管理（Phase 2 自我改进） | `/ultrapower:nexus` |

### Axiom Skills

| Skill | 说明 | 手动命令 |
|-------|-------------|----------------|
| `ax-analyze-error` | 分析错误并生成修复方案 | `/ultrapower:ax-analyze-error` |
| `ax-context` | 加载/保存 Axiom 上下文快照 | `/ultrapower:ax-context` |
| `ax-decompose` | 将需求分解为原子任务 DAG | `/ultrapower:ax-decompose` |
| `ax-draft` | 生成 Draft PRD | `/ultrapower:ax-draft` |
| `ax-evolution` | 查看知识演化历史 | `/ultrapower:ax-evolution` |
| `ax-evolve` | 触发知识收割与工作流优化 | `/ultrapower:ax-evolve` |
| `ax-implement` | 执行 Axiom 任务实现 | `/ultrapower:ax-implement` |
| `ax-reflect` | 任务完成后反思与学习 | `/ultrapower:ax-reflect` |
| `ax-review` | 5 专家并行审查聚合 | `/ultrapower:ax-review` |
| `ax-rollback` | 回滚到上一个检查点 | `/ultrapower:ax-rollback` |
| `ax-status` | 查看 Axiom 工作流状态 | `/ultrapower:ax-status` |
| `ax-suspend` | 挂起当前工作流并保存状态 | `/ultrapower:ax-suspend` |
| `ax-knowledge` | 查询 Axiom 知识库 | `/ultrapower:ax-knowledge` |
| `ax-export` | 导出 Axiom 工作流产物 | `/ultrapower:ax-export` |

---

## Slash Commands

所有 skills 均可通过 `/ultrapower:` 前缀作为 slash 命令使用。

| 命令 | 说明 |
|---------|-------------|
| `/ultrapower:autopilot <task>` | 全自主执行 |
| `/ultrapower:ultrawork <task>` | 并行 agents 最大性能模式 |
| `/ultrapower:ultrapilot <task>` | 并行 autopilot（速度提升 3-5 倍） |
| `/ultrapower:swarm <N>:<agent> <task>` | 协调 agent 集群 |
| `/ultrapower:team <task>` | N 个协调 agents（Claude Code 原生 team） |
| `/ultrapower:pipeline <stages>` | 顺序 agent 链式执行 |
| `/ultrapower:ralph-init <task>` | 初始化 PRD 以进行结构化任务跟踪 |
| `/ultrapower:ralph <task>` | 自引用循环直至任务完成 |
| `/ultrapower:ultraqa <goal>` | 自主 QA 循环工作流 |
| `/ultrapower:plan <description>` | 启动规划会话 |
| `/ultrapower:ralplan <description>` | 共识迭代规划 |
| `/ultrapower:review [plan-path]` | 用 critic 审查计划 |
| `/ultrapower:brainstorming` | 实现前探索需求和设计方案 |
| `/ultrapower:writing-plans <task>` | 将需求拆解为原子任务计划 |
| `/ultrapower:test-driven-development <feature>` | TDD 工作流强制执行 |
| `/ultrapower:systematic-debugging` | 系统化调试工作流 |
| `/ultrapower:requesting-code-review` | 请求代码审查 |
| `/ultrapower:receiving-code-review` | 处理代码审查反馈 |
| `/ultrapower:finishing-a-development-branch` | 完成开发分支 |
| `/ultrapower:using-git-worktrees` | 创建隔离 git worktree |
| `/ultrapower:verification-before-completion` | 声明完成前验证 |
| `/ultrapower:dispatching-parallel-agents` | 并行分发独立任务 |
| `/ultrapower:deepsearch <query>` | 多策略深度代码库搜索 |
| `/ultrapower:deepinit [path]` | 用分层 AGENTS.md 文件索引代码库 |
| `/ultrapower:analyze <target>` | 深度分析与调查 |
| `/ultrapower:sciomc <topic>` | 并行研究编排 |
| `/ultrapower:ccg <task>` | Claude-Codex-Gemini 三模型并行编排 |
| `/ultrapower:external-context <query>` | 并行网络搜索 |
| `/ultrapower:tdd <feature>` | TDD 工作流（test-driven-development 别名） |
| `/ultrapower:learner` | 从会话中提取可复用 skill |
| `/ultrapower:trace` | 显示 agent 流程追踪时间线 |
| `/ultrapower:note <content>` | 保存笔记到 notepad.md |
| `/ultrapower:cancel` | 统一取消 |
| `/ultrapower:omc-setup` | 一次性安装向导 |
| `/ultrapower:omc-doctor` | 诊断并修复安装问题 |
| `/ultrapower:omc-help` | 显示 OMC 使用指南 |
| `/ultrapower:hud` | 配置 HUD 状态栏 |
| `/ultrapower:release` | 自动化发布工作流 |
| `/ultrapower:mcp-setup` | 配置 MCP 服务器 |
| `/ultrapower:configure-discord` | 配置 Discord 通知 |
| `/ultrapower:configure-telegram` | 配置 Telegram 通知 |
| `/ultrapower:project-session-manager` | 管理隔离开发环境 |
| `/ultrapower:skill` | 管理本地 skills |
| `/ultrapower:writing-skills` | 创建/编辑/验证 skills |
| `/ultrapower:learn-about-omc` | 了解 OMC 使用模式 |

---

## Hooks System

ultrapower 包含 47 个生命周期 hooks，用于增强 Claude Code 的行为。

### 执行模式 Hooks

| Hook | 说明 |
|------|-------------|
| `autopilot` | 从想法到可运行代码的全自主执行 |
| `ultrawork` | 最大并行 agent 执行 |
| `ralph` | 持续执行直至验证完成 |
| `ultrapilot` | 带文件所有权的并行 autopilot |
| `ultraqa` | QA 循环直至目标达成 |
| `mode-registry` | 跟踪当前执行模式（含 ultrawork、ralph、team 等） |
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
| `subagent-stop` | 子 agent 完成时触发，防止无限循环 |
| `teammate-idle` | 团队成员空闲时触发，默认允许 |
| `session-end` | 会话结束时触发，清理临时状态 |
| `user-prompt-submit` | 用户提交提示词前触发，用于关键词检测 |
| `permission-request` | 工具权限请求时触发 |
| `task-completed` | 任务完成时触发 |
| `config-change` | 配置变更时触发 |
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
| `flow-tracer` | Agent 流程追踪记录（hook 触发、keyword 检测、skill 激活、模式变更） |
| `session-end` | 会话终止处理 |
| `non-interactive-env` | CI/非交互式环境处理 |
| `agent-usage-reminder` | 提醒使用专业 agents |
| `background-notification` | 后台任务完成通知 |
| `plugin-patterns` | 插件模式检测 |
| `setup` | 初始安装与配置 |
| `beads-context` | 上下文珠链管理 |
| `project-memory` | 项目级记忆管理 |

### Axiom Hooks

| Hook | 说明 |
|------|-------------|
| `axiom-boot` | 会话启动时注入 Axiom 记忆上下文 |
| `axiom-guards` | Axiom 门禁规则执行（Expert/User/CI Gate） |

---

## Magic Keywords

在提示词中任意位置包含以下关键词即可激活增强模式：

| 关键词 | 效果 |
|---------|--------|
| `ultrawork`, `ulw` | 激活并行 agent 编排 |
| `autopilot`, `auto-pilot`, `fullsend`, `full auto` | 全自主执行 |
| `ultrapilot`, `ultra-pilot`, `parallel build`, `swarm build` | 并行 autopilot（速度提升 3-5 倍） |
| `ralph` | 持续执行直至验证完成 |
| `team`, `coordinated team` | Team 模式多 agent 协调 |
| `swarm N agents`, `coordinated agents`, `team mode` | 协调 agent 集群 |
| `plan this`, `plan the` | 规划访谈工作流 |
| `ralplan` | 迭代规划共识 |
| `tdd`, `test first` | TDD 工作流强制执行 |
| `ultrathink` | 扩展思考模式 |
| `deepsearch`, `search the codebase`, `find in codebase` | 深度代码库搜索 |
| `deep analyze`, `deepanalyze` | 深度分析模式 |
| `ccg`, `claude-codex-gemini` | Claude-Codex-Gemini 三模型并行编排 |
| `ask codex`, `use codex`, `delegate to codex` | 委派给 Codex（OpenAI） |
| `ask gemini`, `use gemini`, `delegate to gemini` | 委派给 Gemini（Google） |
| `agent pipeline`, `chain agents` | 顺序 agent 链式执行 |
| `cancelomc`, `stopomc` | 统一取消所有活跃模式 |

### 示例

```bash
# 在 Claude Code 中：

# 最大并行度
ultrawork implement user authentication with OAuth

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
chain agents: analyze → fix → test this bug

# 深度代码库搜索
deepsearch all files that import the utils module

# 深度分析
deep analyze why the tests are failing

# 三模型并行编排
ccg: implement the payment module

# 取消活跃模式
cancelomc
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
| **Windows** | Claude Code Plugin | Node.js (.mjs) |
| **macOS** | Claude Code Plugin | Node.js (.mjs) |
| **Linux** | Claude Code Plugin | Node.js (.mjs) |

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

### Python REPL 工具

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| `python_repl` | ✅ 已实现 | 持久 Python REPL，支持 pandas/numpy/matplotlib 数据分析 |

### Notepad 工具（会话记忆）

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| `notepad_read` | ✅ 已实现 | 读取 notepad 内容（章节：all/priority/working/manual） |
| `notepad_write_priority` | ✅ 已实现 | 写入优先上下文（≤500 字符，会话开始时自动加载） |
| `notepad_write_working` | ✅ 已实现 | 写入工作记忆（带时间戳，7 天后自动清理） |
| `notepad_write_manual` | ✅ 已实现 | 写入手动记录（永久保存，永不自动清理） |
| `notepad_prune` | ✅ 已实现 | 清理 N 天前的工作记忆条目 |
| `notepad_stats` | ✅ 已实现 | 获取 notepad 统计信息（大小、条目数、最旧条目） |

> **存储位置**：`{worktree}/.omc/notepad.md`

### State 工具（执行模式状态）

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| `state_read` | ✅ 已实现 | 读取指定模式的状态（autopilot/ralph/ultrawork/team 等） |
| `state_write` | ✅ 已实现 | 写入/更新模式状态（支持 active、iteration、phase 等字段） |
| `state_clear` | ✅ 已实现 | 清除指定模式的状态文件 |
| `state_list_active` | ✅ 已实现 | 列出所有当前活跃的模式 |
| `state_get_status` | ✅ 已实现 | 获取指定模式或所有模式的详细状态 |

> **支持的模式**：`autopilot`、`ultrapilot`、`team`、`pipeline`、`ralph`、`ultrawork`、`ultraqa`、`ralplan`

### Project Memory 工具（项目级持久记忆）

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| `project_memory_read` | ✅ 已实现 | 读取项目记忆（章节：techStack/build/conventions/structure/notes/directives） |
| `project_memory_write` | ✅ 已实现 | 写入/更新项目记忆（支持合并模式） |
| `project_memory_add_note` | ✅ 已实现 | 添加分类笔记（build/test/deploy/env/architecture 等） |
| `project_memory_add_directive` | ✅ 已实现 | 添加用户指令（跨会话持久化，抗压缩） |

> **存储位置**：`{worktree}/.omc/project-memory.json`

### Trace 工具（Agent 流程追踪）

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| `trace_timeline` | ✅ 已实现 | 显示按时间顺序的 agent 流程追踪（hooks/skills/agents/keywords/tools/modes） |
| `trace_summary` | ✅ 已实现 | 显示会话聚合统计（hook 统计、keyword 频率、skill 激活、工具瓶颈） |

### Skills 工具（Skill 加载）

| 工具 | 状态 | 说明 |
|------|--------|-------------|
| `load_omc_skills_local` | ✅ 已实现 | 从项目本地加载 OMC skills |
| `load_omc_skills_global` | ✅ 已实现 | 从全局安装加载 OMC skills |
| `list_omc_skills` | ✅ 已实现 | 列出所有可用 skills |

### 工具汇总

ultrapower 通过 `mcp__plugin_ultrapower_t__` 前缀暴露 **35 个自定义工具**：

| 类别 | 数量 | 工具前缀 |
|------|------|---------|
| LSP（语言服务器协议） | 12 | `lsp_*` |
| AST（结构化代码搜索） | 2 | `ast_grep_*` |
| Python REPL | 1 | `python_repl` |
| Notepad（会话记忆） | 6 | `notepad_*` |
| State（执行模式状态） | 5 | `state_*` |
| Project Memory（项目记忆） | 4 | `project_memory_*` |
| Trace（流程追踪） | 2 | `trace_*` |
| Skills（Skill 加载） | 3 | `*_omc_skills*` |
| **合计** | **35** | |

> **禁用工具组**：通过 `OMC_DISABLE_TOOLS=lsp,python-repl,project-memory` 等环境变量可在启动时禁用指定工具组。

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
| `axiom` | 显示 Axiom 系统状态（状态/目标/任务/学习队列/知识库/成功率） | `false` |
| `suggestions` | 显示智能下一步建议（基于上下文/Axiom 状态/会话健康） | `false` |

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

ultrapower 包含一个静默自动更新系统，在后台检查更新。

特性：
- **频率限制**：最多每 24 小时检查一次
- **并发安全**：锁文件防止同时更新
- **跨平台**：在 macOS 和 Linux 上均可工作

如需手动更新，重新运行插件安装命令或使用 Claude Code 内置的更新机制。

### 卸载

```bash
curl -fsSL https://raw.githubusercontent.com/liangjie559567/ultrapower/main/scripts/uninstall.sh | bash
```

Or manually:

```bash
rm ~/.claude/agents/{architect,document-specialist,explore,designer,writer,vision,critic,analyst,executor,qa-tester}.md
rm ~/.claude/commands/{analyze,autopilot,deepsearch,plan,review,ultrawork}.md
```

---

## Axiom 系统（深度融合）

ultrapower 深度融合了 Axiom 智能体编排框架，提供完整的需求→开发→进化工作流。

### Axiom Agents（14 个）

| 智能体 | 模型 | 用途 |
|-------|-------|------|
| axiom-requirement-analyst | sonnet | 需求三态门（PASS/CLARIFY/REJECT） |
| axiom-product-designer | sonnet | Draft PRD + Mermaid 流程图生成 |
| axiom-review-aggregator | sonnet | 5 专家并行评审 + 冲突仲裁 |
| axiom-prd-crafter | sonnet | 工程级 PRD + 门禁验证 |
| axiom-system-architect | sonnet | 原子任务 DAG + Manifest 生成 |
| axiom-evolution-engine | sonnet | 知识收割 + 模式检测 + 工作流优化 |
| axiom-context-manager | sonnet | 7 种记忆操作（读/写/状态/检查点） |
| axiom-worker | sonnet | PM→Worker 协议，三态输出（QUESTION/COMPLETE/BLOCKED） |
| axiom-ux-director | sonnet | UX/体验专家评审，输出 review_ux.md |
| axiom-product-director | sonnet | 产品战略专家评审，输出 review_product.md |
| axiom-domain-expert | sonnet | 领域知识专家评审，输出 review_domain.md |
| axiom-tech-lead | sonnet | 技术可行性评审，输出 review_tech.md |
| axiom-critic | sonnet | 安全/质量/逻辑评审，输出 review_critic.md |
| axiom-sub-prd-writer | sonnet | 将 Manifest 任务拆解为可执行 Sub-PRD |

### Axiom Skills（14 个）

| Skill | 指令 | 用途 |
|-------|------|------|
| ax-draft | `/ax-draft` | 需求澄清 → Draft PRD → 用户确认 |
| ax-review | `/ax-review` | 5 专家并行评审 → 聚合 → Rough PRD |
| ax-decompose | `/ax-decompose` | Rough PRD → 系统架构 → 原子任务 DAG |
| ax-implement | `/ax-implement` | 按 Manifest 执行任务，CI 门禁，自动修复 |
| ax-analyze-error | `/ax-analyze-error` | 根因诊断 → 自动修复 → 知识队列 |
| ax-reflect | `/ax-reflect` | 会话反思 → 经验提取 → Action Items |
| ax-evolve | `/ax-evolve` | 处理学习队列 → 更新知识库 → 模式检测 |
| ax-status | `/ax-status` | 完整系统状态仪表盘 |
| ax-rollback | `/ax-rollback` | 回滚到最近检查点（需用户确认） |
| ax-suspend | `/ax-suspend` | 保存会话状态，安全退出 |
| ax-context | `/ax-context` | 直接操作 Axiom 记忆系统 |
| ax-evolution | `/ax-evolution` | 进化引擎统一入口（evolve/reflect/knowledge/patterns） |
| ax-knowledge | `/ax-knowledge` | 查询 Axiom 知识库和模式库 |
| ax-export | `/ax-export` | 导出 Axiom 工作流产物为可移植 zip |

### Axiom Hooks（2 个）

| Hook | 位置 | 用途 |
|------|------|------|
| axiom-boot | `src/hooks/axiom-boot/` | 会话启动时注入记忆上下文 |
| axiom-guards | `src/hooks/axiom-guards/` | 门禁规则执行（Expert/User/CI Gate） |

### Axiom 记忆系统

```
.omc/axiom/
├── active_context.md       # 当前任务状态（短期记忆）
├── project_decisions.md    # 架构决策记录（长期记忆）
├── user_preferences.md     # 用户偏好
├── state_machine.md        # 状态机定义
├── reflection_log.md       # 反思日志
└── evolution/
    ├── knowledge_base.md   # 知识图谱（置信度系统）
    ├── pattern_library.md  # 代码模式库（出现次数 >= 3 提升）
    ├── learning_queue.md   # 待处理学习素材（P0-P3 优先级）
    └── workflow_metrics.md # 工作流执行指标
```

### Axiom 状态机

`IDLE → PLANNING → CONFIRMING → EXECUTING → AUTO_FIX → BLOCKED → ARCHIVING → IDLE`

### 适配器文件

| 文件 | 目标工具 |
|------|---------|
| `.kiro/steering/axiom.md` | Kiro |
| `.cursorrules` | Cursor |
| `.gemini/GEMINI.md` | Gemini |
| `.gemini/GEMINI-CLI.md` | Gemini CLI |
| `.opencode/OPENCODE.md` | OpenCode CLI |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.codex/CODEX.md` | Codex CLI |

### 自我进化系统详细文档

Axiom 自我进化系统的完整使用指南、安装说明和故障排除请参阅：

**[docs/EVOLUTION.md](./EVOLUTION.md)** — Axiom 自我进化系统完整文档

包含内容：
- 系统概述与架构
- 安装与初始化步骤
- 核心组件说明（进化引擎、上下文管理器、Boot Hook、Guards Hook）
- 记忆系统详解（知识库、模式库、学习队列）
- 进化工作流（ax-reflect + ax-evolve 完整流程）
- 所有 ax-* Skills 使用指南
- 自动触发机制
- 知识库管理与置信度系统
- 状态机与门禁系统
- HUD 集成
- 故障排除

**[docs/NEXUS.md](./NEXUS.md)** — Nexus 主动进化系统完整文档

包含内容：
- Phase 1 被动学习（已完成）与 Phase 2 主动学习架构
- Nexus 双层架构（插件层 + VPS 云端层）
- 反馈系统、效果追踪、主动推荐、质量迭代模块详解
- Consciousness Loop、Self-Modifier、Self-Evaluator 模块
- Git 同步通信机制与数据存储结构
- Phase 2 与 Nexus 配置参考
- VPS 部署指南（nexus-daemon）
- 实现路线图（P0/P1/P2 优先级）

---

## Changelog

版本历史和发布说明请参阅 [CHANGELOG.md](../CHANGELOG.md)。

---

## License

MIT - 参见 [LICENSE](../LICENSE)

## Credits

灵感来源于 code-yeongyu 的 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)。

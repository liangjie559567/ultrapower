# Skills 参考手册（71 个）

ultrapower v5.6.9 包含 71 个 skills，按类别分类。

## 快速导航

- [工作流 Skills](#工作流-skills) - 8 个
- [开发 Skills](#开发-skills) - 15 个
- [Axiom Skills](#axiom-skills) - 14 个
- [增强 Skills](#增强-skills) - 13 个
- [工具类 Skills](#工具类-skills) - 21 个

---

## 工作流 Skills

核心执行模式。

| Skill | 触发词 | 用途 |
|-------|--------|------|
| `autopilot` | "autopilot"、"build me" | 从想法到可运行代码的全自主执行 |
| `team` | "team"、"coordinated team" | N 个协调 agents，支持分阶段流水线 |
| `ralph` | "ralph"、"don't stop" | 带 verifier 验证的自引用循环 |
| `ultrawork` | "ulw"、"ultrawork" | 并行 agent 编排的最大并行度 |
| `ultrapilot` | "ultrapilot"、"parallel build" | Team 的兼容性外观 |
| `swarm` | "swarm" | Team 的兼容性外观 |
| `plan` | "plan this"、"plan the" | 战略规划 |
| `ralplan` | "ralplan"、"consensus plan" | 与 Planner、Architect、Critic 迭代规划 |

---

## 开发 Skills

开发工作流和最佳实践。

| Skill | 触发词 | 用途 |
|-------|--------|------|
| `brainstorming` | "brainstorm" | 代码前设计和需求细化 |
| `writing-plans` | "write plan" | 将工作拆解为原子任务 |
| `executing-plans` | "execute plan" | 带检查点的批量执行 |
| `subagent-driven-development` | "subagent dev" | 每任务独立 subagent + 两阶段审查 |
| `test-driven-development` | "tdd"、"test first" | RED-GREEN-REFACTOR 循环 |
| `systematic-debugging` | "debug" | 4 阶段根因分析 |
| `verification-before-completion` | "verify" | 完成前验证 |
| `requesting-code-review` | "review" | 代码审查前检查清单 |
| `receiving-code-review` | "receive review" | 响应审查反馈 |
| `using-git-worktrees` | "worktree" | 并行开发分支 |
| `finishing-a-development-branch` | "finish branch" | 合并/PR 决策工作流 |
| `next-step-router` | "next step" | 关键节点推荐最优下一步 |
| `dispatching-parallel-agents` | "dispatch" | 并行分发独立任务 |
| `analyze` | "analyze"、"debug" | 深度分析与调查 |
| `deepsearch` | "search"、"find in codebase" | 多策略深度代码库搜索 |

---

## Axiom Skills

Axiom 自我进化系统工作流。

| Skill | 触发词 | 用途 |
|-------|--------|------|
| `ax-draft` | "ax-draft" | 需求澄清 → Draft PRD → 用户确认 |
| `ax-review` | "ax-review" | 5 专家并行评审 → 聚合 → Rough PRD |
| `ax-decompose` | "ax-decompose" | Rough PRD → 系统架构 → 原子任务 DAG |
| `ax-implement` | "ax-implement" | 按 Manifest 执行任务，CI 门禁，自动修复 |
| `ax-analyze-error` | "ax-analyze-error" | 根因诊断 → 自动修复 → 知识队列 |
| `ax-reflect` | "ax-reflect" | 会话反思 → 经验提取 → Action Items |
| `ax-evolve` | "ax-evolve" | 处理学习队列 → 更新知识库 → 模式检测 |
| `ax-status` | "ax-status" | 完整系统状态仪表盘 |
| `ax-rollback` | "ax-rollback" | 回滚到最近检查点 |
| `ax-suspend` | "ax-suspend" | 保存会话状态，安全退出 |
| `ax-context` | "ax-context" | 直接操作 Axiom 记忆系统 |
| `ax-evolution` | "ax-evolution" | 进化引擎统一入口 |
| `ax-knowledge` | "ax-knowledge" | 查询 Axiom 知识库 |
| `ax-export` | "ax-export" | 导出 Axiom 工作流产物 |

---

## 增强 Skills

高级功能和专业能力。

| Skill | 触发词 | 用途 |
|-------|--------|------|
| `deepinit` | "deepinit" | 分层 AGENTS.md 代码库文档化 |
| `sciomc` | "sciomc" | 并行 scientist agents 分析 |
| `external-context` | "external-context" | 并行 document-specialist 网络搜索 |
| `ccg` | "ccg" | Claude-Codex-Gemini 三模型并行编排 |
| `frontend-ui-ux` | "ui"、"ux" | UI/UX 专业能力（静默激活） |
| `git-master` | "git" | Git 专家，原子提交（静默激活） |
| `build-fix` | "fix build"、"type errors" | 修复构建和 TypeScript 错误 |
| `code-review` | "review code" | 全面代码审查 |
| `security-review` | "security review" | 安全漏洞检测 |
| `trace` | "trace" | 显示 agent 流程追踪时间线 |
| `learn-about-omc` | "learn omc" | 了解 OMC 使用模式 |
| `tdd` | "tdd"、"red green" | TDD 工作流（test-engineer 别名） |
| `review` | "review plan"、"critique plan" | 用 critic 审查工作计划 |

---

## 工具类 Skills

系统管理和配置工具。

| Skill | 触发词 | 用途 |
|-------|--------|------|
| `cancel` | "cancel"、"stop" | 统一取消所有执行模式 |
| `note` | "note" | 保存笔记到抗压缩 notepad |
| `learner` | "learner" | 从会话中提取可复用 skill |
| `omc-setup` | "setup omc" | 一次性安装向导 |
| `mcp-setup` | "mcp-setup" | 配置 MCP 服务器 |
| `hud` | "hud" | 配置 HUD 状态栏 |
| `omc-doctor` | "omc-doctor" | 诊断并修复安装问题 |
| `omc-help` | "omc-help" | 显示 OMC 使用指南 |
| `release` | "release" | 自动化发布工作流 |
| `ralph-init` | "ralph-init" | 初始化 PRD 以进行结构化任务跟踪 |
| `writer-memory` | "writer-memory" | 面向写作者的 agent 记忆系统 |
| `project-session-manager` | "psm"、"session" | 管理隔离开发环境 |
| `skill` | "skill" | 管理本地 skills |
| `wizard` | "wizard" | 交互式配置向导 |
| `writing-skills` | "writing-skills" | 创建/编辑/验证 skills |
| `configure-discord` | "configure discord" | 配置 Discord webhook 通知 |
| `configure-telegram` | "configure telegram" | 配置 Telegram bot 通知 |
| `using-superpowers` | "superpowers" | 建立 skill 使用规则 |
| `omc-setup` | "setup" | 安装向导 |
| `mcp-setup` | "mcp" | MCP 配置 |
| `skill` | "skill" | Skill 管理 |

---

## Skills 分布

| 类别 | 数量 | 说明 |
|------|------|------|
| 工作流 | 8 | 执行模式和编排 |
| 开发 | 15 | 开发工作流 |
| Axiom | 14 | 自我进化系统 |
| 增强 | 13 | 高级功能 |
| 工具类 | 21 | 系统管理 |
| **总计** | **71** | 完整 skills 库 |

---

## 使用指南

### 自动触发

Skills 根据上下文自动激活，无需手动调用：

```bash
# 自动激活 frontend-ui-ux
当编辑 .tsx/.vue 文件时

# 自动激活 git-master
当执行 git 相关操作时

# 自动激活 build-fix
当构建失败时
```

### 手动调用

```bash
# 工作流 skills
/team "构建用户认证系统"
/plan "设计数据库架构"

# Axiom skills
/ax-draft "用户登录功能"
/ax-implement

# 工具类 skills
/omc-setup
/skill list
```

### 组合使用

```bash
# Team + Axiom
/team /ax-draft "新功能"

# Ralph + Ultrawork
/ralph /ultrawork "大型重构"

# Plan + Review
/plan "任务" --review
```

---

## 相关文档

- [Agents 手册](AGENTS.md) - 49 个 agents
- [Team 流水线](../guides/team-pipeline.md)
- [Axiom 框架](../EVOLUTION.md)
- [快速入门](../getting-started/QUICKSTART.md)

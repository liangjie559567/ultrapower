# ultrapower

ultrapower 是 Claude Code 的智能多 Agent 编排层（OMC），在 superpowers 工作流基础上深度融合了 Axiom 框架，提供 **39 个专业 agents**、**67 个 skills** 和完整的 TypeScript hooks 系统。

## 核心能力

- **多 Agent 编排**：Team、ultrawork、ralph、autopilot 等多种执行模式
- **Axiom 框架集成**：LSP/AST 代码智能、持久记忆、MCP 路由
- **完整工作流**：从头脑风暴到代码审查的端到端开发流程
- **自动触发**：Skills 根据上下文自动激活，无需手动调用

## 安装

### Claude Code（插件市场）

```bash
# 第一步：添加插件市场
/plugin marketplace add liangjie559567/ultrapower

# 第二步：安装插件
/plugin install ultrapower@ultrapower-marketplace
```

### 验证安装

启动新会话，说 "help me plan this feature"，agent 应自动调用相关 skill。

---

## 基础工作流

1. **brainstorming** — 代码前必须先设计。通过对话细化需求，探索 2-3 种方案，呈现设计并获批准，保存设计文档。

2. **using-git-worktrees** — 设计批准后创建隔离工作区，新建分支，运行项目初始化，验证测试基线。

3. **writing-plans** — 将工作拆解为 2-5 分钟的原子任务。每个任务包含精确文件路径、完整代码、验证步骤。

4. **subagent-driven-development** / **executing-plans** — 每个任务派发独立 subagent，两阶段审查（规格合规 + 代码质量），或批量执行带检查点。

5. **test-driven-development** — RED-GREEN-REFACTOR：先写失败测试，再写最小实现，再重构。

6. **requesting-code-review** — 任务间审查，按严重程度报告问题，关键问题阻塞进度。

7. **finishing-a-development-branch** — 验证测试，呈现选项（merge/PR/保留/丢弃），清理 worktree。

---

## Agents（39 个）

### 构建/分析通道

| Agent | 模型 | 用途 |
|-------|------|------|
| `explore` | haiku | 代码库发现、符号/文件映射 |
| `analyst` | opus | 需求澄清、验收标准 |
| `planner` | opus | 任务排序、执行计划 |
| `architect` | opus | 系统设计、接口、长期权衡 |
| `debugger` | sonnet | 根因分析、回归隔离 |
| `executor` | sonnet | 代码实现、重构、功能开发 |
| `deep-executor` | opus | 复杂自主目标导向任务 |
| `verifier` | sonnet | 完成证据、声明验证 |

### 审查通道

| Agent | 模型 | 用途 |
|-------|------|------|
| `style-reviewer` | haiku | 格式、命名、惯用法 |
| `quality-reviewer` | sonnet | 逻辑缺陷、可维护性 |
| `api-reviewer` | sonnet | API 契约、版本控制 |
| `security-reviewer` | sonnet | 漏洞、信任边界 |
| `performance-reviewer` | sonnet | 热点、复杂度优化 |
| `code-reviewer` | opus | 跨关注点综合审查 |

### 领域专家

| Agent | 模型 | 用途 |
|-------|------|------|
| `dependency-expert` | sonnet | 外部 SDK/API/包评估 |
| `test-engineer` | sonnet | 测试策略、覆盖率 |
| `quality-strategist` | sonnet | 质量策略、发布就绪性 |
| `build-fixer` | sonnet | 构建/工具链/类型失败 |
| `designer` | sonnet | UX/UI 架构、交互设计 |
| `writer` | haiku | 文档、迁移说明 |
| `qa-tester` | sonnet | 交互式 CLI/服务验证 |
| `scientist` | sonnet | 数据/统计分析 |
| `document-specialist` | sonnet | 外部文档查找 |
| `git-master` | sonnet | 提交策略、历史整洁 |

### 产品通道

| Agent | 模型 | 用途 |
|-------|------|------|
| `product-manager` | sonnet | 问题定义、PRD |
| `ux-researcher` | sonnet | 启发式审计、可用性 |
| `information-architect` | sonnet | 分类、导航 |
| `product-analyst` | sonnet | 产品指标、漏斗分析 |

### 协调

| Agent | 模型 | 用途 |
|-------|------|------|
| `critic` | opus | 计划/设计批判性挑战 |
| `vision` | sonnet | 图片/截图/图表分析 |

### Axiom Agents（v5.0.2 新增）

| Agent | 模型 | 用途 |
|-------|------|------|
| `ultrapower:analyst` | opus | 规划前顾问，需求分析 |
| `ultrapower:architect` | opus | 战略架构与调试顾问（只读） |
| `ultrapower:critic` | opus | 工作计划审查专家 |
| `ultrapower:deep-executor` | opus | 复杂目标任务自主执行 |
| `ultrapower:planner` | opus | 带访谈工作流的战略规划 |
| `ultrapower:designer` | sonnet | UI/UX 设计开发者 |
| `ultrapower:scientist` | sonnet | 数据分析和研究执行 |
| `ultrapower:vision` | sonnet | 图像/PDF/图表视觉分析 |

---

## Skills（67 个）

### 工作流 Skills

| Skill | 触发词 | 用途 |
|-------|--------|------|
| `autopilot` | "autopilot", "build me" | 从想法到可运行代码的全自主执行 |
| `ralph` | "ralph", "don't stop" | 带 verifier 验证的自引用循环 |
| `ultrawork` | "ulw", "ultrawork" | 并行 agent 编排最大并行度 |
| `team` | "team", "coordinated team" | N 个协调 agents，阶段感知路由 |
| `ultrapilot` | "ultrapilot", "parallel build" | 带文件所有权分区的并行 autopilot |
| `pipeline` | "pipeline", "chain agents" | 带数据传递的顺序 agent 链 |
| `ultraqa` | 由 autopilot 激活 | QA 循环：测试、验证、修复、重复 |
| `plan` | "plan this", "plan the" | 战略规划，支持 `--consensus`/`--review` |
| `ralplan` | "ralplan", "consensus plan" | 与 Planner/Architect/Critic 迭代规划 |
| `swarm` | "swarm" | Team 的兼容性外观 |

### 开发工作流 Skills

| Skill | 用途 |
|-------|------|
| `brainstorming` | 设计对话，代码前必须先设计 |
| `writing-plans` | 详细实现计划，原子任务 |
| `executing-plans` | 带检查点的批量执行 |
| `subagent-driven-development` | 每任务独立 subagent + 两阶段审查 |
| `test-driven-development` | RED-GREEN-REFACTOR 循环 |
| `systematic-debugging` | 4 阶段根因分析 |
| `verification-before-completion` | 完成前验证 |
| `requesting-code-review` | 代码审查前检查清单 |
| `receiving-code-review` | 响应审查反馈 |
| `using-git-worktrees` | 并行开发分支 |
| `finishing-a-development-branch` | 合并/PR 决策工作流 |
| `next-step-router` | 关键节点推荐最优下一步 |

### Axiom Skills（v5.0.2 新增）

| Skill | 用途 |
|-------|------|
| `deepinit` | 深度代码库初始化，生成层级化 AGENTS.md |
| `sciomc` | 并行 scientist agents 综合分析 |
| `external-context` | 并行 document-specialist 网络搜索 |
| `ccg` | Claude-Codex-Gemini 三模型编排 |
| `trace` | Agent 流程追踪时间线 |
| `hud` | 配置 HUD 显示选项 |
| `omc-doctor` | 诊断并修复安装问题 |
| `project-session-manager` | git worktree + tmux 隔离环境 |
| `writer-memory` | 面向作家的智能记忆系统 |
| `ralph-init` | 初始化 PRD 进行结构化 ralph 执行 |
| `learn-about-omc` | 了解使用模式，获取个性化建议 |
| `skill` | 管理本地 skill：列出、添加、删除、编辑 |

### 工具类 Skills

`cancel`、`note`、`learner`、`omc-setup`、`mcp-setup`、`release`、`writing-skills`、`using-superpowers`、`configure-discord`、`configure-telegram`

---

## 执行模式

### Team 流水线（默认多 Agent 编排器）

```
team-plan → team-prd → team-exec → team-verify → team-fix（循环）
```

- **team-plan**：`explore` + `planner`，可选 `analyst`/`architect`
- **team-prd**：`analyst`，可选 `product-manager`/`critic`
- **team-exec**：`executor` + 任务适配专家
- **team-verify**：`verifier` + 按需审查 agents
- **team-fix**：根据缺陷类型路由到 `executor`/`build-fixer`/`debugger`

### MCP 路由

对只读分析任务优先使用 MCP 工具（更快更经济）：

- **Codex**（`mcp__x__ask_codex`）：架构审查、规划验证、代码审查
- **Gemini**（`mcp__g__ask_gemini`）：UI/UX 设计、大上下文任务（1M tokens）

### Axiom 代码智能

- **LSP**：hover、goto definition、find references、diagnostics、rename
- **AST**：`ast_grep_search`（结构化模式搜索）、`ast_grep_replace`（结构化转换）
- **Python REPL**：持久数据分析环境

---

## 哲学

- **测试驱动开发** — 始终先写测试
- **系统化而非临时** — 流程优于猜测
- **复杂度降低** — 简洁是首要目标
- **证据优于声明** — 声明成功前先验证

---

## 赞助

如果 ultrapower 帮助你完成了有价值的工作，欢迎[赞助开源工作](https://github.com/sponsors/obra)。

## 贡献

Skills 直接存放在本仓库中。贡献方式：

1. Fork 仓库
2. 为你的 skill 创建分支
3. 遵循 `writing-skills` skill 创建和测试新 skill
4. 提交 PR

详见 `skills/writing-skills/SKILL.md`。

## 更新

```bash
/plugin update ultrapower
```

## 许可证

MIT License — 详见 LICENSE 文件

## 支持

- **Issues**: https://github.com/liangjie559567/ultrapower/issues
- **Marketplace**: https://github.com/liangjie559567/ultrapower
- **完整参考文档**: [docs/REFERENCE.md](docs/REFERENCE.md)
- **迁移指南**: [docs/MIGRATION.md](docs/MIGRATION.md)

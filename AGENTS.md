<!-- Generated: 2026-01-28 | Updated: 2026-02-25 -->

# ultrapower

严格的多智能体编排：工作流强制执行 + 并行执行

**版本：** 5.0.3
**用途：** 将 Claude Code 转变为专业 AI 智能体的指挥者
**灵感来源：** oh-my-zsh / oh-my-opencode

## 用途

ultrapower 为 Claude Code 提供以下增强功能：

- **49 个专业智能体**，覆盖多个领域，支持三级模型路由（Haiku/Sonnet/Opus）
- **70 个 skills**，用于工作流自动化和专业行为
- **35 个 hooks**，用于事件驱动的执行模式和增强功能
- **15 个自定义工具**，包括 12 个 LSP、2 个 AST 和 Python REPL
- **执行模式**：autopilot、ultrawork、ralph、ultrapilot、swarm、pipeline
- **MCP 集成**，支持插件范围的工具发现和 skill 加载

## 关键文件

| 文件 | 描述 |
|------|-------------|
| `package.json` | 项目依赖和 npm 脚本 |
| `tsconfig.json` | TypeScript 配置 |
| `CHANGELOG.md` | 版本历史和发布说明 |
| `docs/CLAUDE.md` | 终端用户编排说明（安装到用户项目） |
| `src/index.ts` | 主入口点 - 导出 `createSisyphusSession()` |
| `.mcp.json` | 用于插件发现的 MCP 服务器配置 |
| `.claude-plugin/plugin.json` | Claude Code 插件清单 |

## 子目录

| 目录 | 用途 | 相关 AGENTS.md |
|-----------|---------|-------------------|
| `src/` | TypeScript 源代码 - 核心库 | `src/AGENTS.md` |
| `agents/` | 49 个智能体的 Markdown 提示模板（指南见 `agents/templates/`） | - |
| `skills/` | 70 个工作流 skill 定义 | `skills/AGENTS.md` |
| `commands/` | 17 个斜杠命令定义（Axiom 工作流命令） | - |
| `scripts/` | 构建脚本、工具和自动化 | - |
| `docs/` | 用户文档和指南 | `docs/AGENTS.md` |
| `templates/` | Hook 和规则模板（coding-style、testing、security、performance、git-workflow） | - |
| `benchmark/` | 性能测试框架 | - |
| `bridge/` | 用于插件分发的预打包 MCP 服务器 | - |

## 面向 AI 智能体

### 在此目录中工作

1. **委托优先协议**：你是指挥者，而非执行者。将实质性工作委托出去：

   | 工作类型 | 委托给 | 模型 |
   |-----------|-------------|-------|
   | 代码变更 | `executor` / `deep-executor` | sonnet/opus |
   | 分析 | `architect` / `analyst` | opus/opus |
   | 搜索 | `explore` | haiku |
   | UI/UX | `designer` | sonnet |
   | 文档 | `writer` | haiku |
   | 安全 | `security-reviewer` | sonnet |
   | 构建错误 | `build-fixer` | sonnet |
   | 测试 | `qa-tester` / `test-engineer` | sonnet/sonnet |
   | 代码审查 | `code-reviewer` | opus |
   | 数据分析 | `scientist` | sonnet |

2. **LSP/AST 工具**：使用类 IDE 工具进行代码智能分析：
   - `lsp_hover` - 指定位置的类型信息和文档
   - `lsp_goto_definition` - 跳转到符号定义
   - `lsp_find_references` - 查找代码库中的所有用法
   - `lsp_document_symbols` - 获取文件大纲
   - `lsp_workspace_symbols` - 跨工作区搜索符号
   - `lsp_diagnostics` - 获取单个文件的错误/警告
   - `lsp_diagnostics_directory` - 项目级类型检查（使用 tsc 或 LSP）
   - `lsp_rename` - 预览跨文件重构
   - `lsp_code_actions` - 获取可用的快速修复
   - `ast_grep_search` - 使用模式进行结构化代码搜索
   - `ast_grep_replace` - AST 感知的代码转换
   - `python_repl` - 执行 Python 代码进行数据分析

3. **模型路由**：根据任务复杂度匹配模型层级：
   - **Haiku**（低）：简单查找、简单修复、快速搜索
   - **Sonnet**（中）：标准实现、中等推理
   - **Opus**（高）：复杂推理、架构设计、调试

### 修改检查清单

#### 跨文件依赖

| 如果你修改了... | 还需检查/更新... |
|------------------|---------------------|
| `agents/*.md` | `src/agents/definitions.ts`、`src/agents/index.ts`、`docs/REFERENCE.md` |
| `skills/*/SKILL.md` | `commands/*.md`（镜像）、`scripts/build-skill-bridge.mjs` |
| `commands/*.md` | `skills/*/SKILL.md`（镜像） |
| `src/hooks/*` | `src/hooks/index.ts`、`src/hooks/bridge.ts`、相关 skill/command |
| 智能体提示 | 分层变体（`-low`、`-medium`、`-high`） |
| 工具定义 | `src/tools/index.ts`、`src/mcp/omc-tools-server.ts`、`docs/REFERENCE.md` |
| `src/hud/*` | `commands/hud.md`、`skills/hud/SKILL.md` |
| `src/mcp/*` | `docs/REFERENCE.md`（MCP 工具部分） |
| 智能体工具分配 | `docs/CLAUDE.md`（智能体工具矩阵） |
| `templates/rules/*` | `src/hooks/rules-injector/`（如果模式发生变化） |
| 新执行模式 | `src/hooks/*/`、`skills/*/SKILL.md`、`commands/*.md`（三者都需更新） |

#### 文档更新（docs/）

| 如果你修改了... | 更新此 docs/ 文件 |
|------------------|----------------------|
| 智能体数量或列表 | `docs/REFERENCE.md`（智能体部分） |
| skill 数量或列表 | `docs/REFERENCE.md`（Skills 部分） |
| hook 数量或列表 | `docs/REFERENCE.md`（Hooks 系统部分） |
| 魔法关键词 | `docs/REFERENCE.md`（魔法关键词部分） |
| 架构或 skill 组合 | `docs/ARCHITECTURE.md` |
| 内部 API 或功能 | `docs/FEATURES.md` |
| 破坏性变更 | `docs/MIGRATION.md` |
| 分层智能体设计 | `docs/TIERED_AGENTS_V2.md` |
| 兼容性要求 | `docs/COMPATIBILITY.md` |
| CLAUDE.md 内容 | `docs/CLAUDE.md`（终端用户说明） |

#### Skills ↔ Commands 关系

- `skills/` 包含带有完整提示的 skill 实现
- `commands/` 包含调用 skills 的斜杠命令定义
- 两者应保持同步以实现相同功能

#### AGENTS.md 更新要求

当你修改以下位置的文件时，更新对应的 AGENTS.md：

| 如果你修改了... | 更新此 AGENTS.md |
|------------------|----------------------|
| 根项目结构、新功能 | `/AGENTS.md`（本文件） |
| `src/**/*.ts` 结构或新模块 | `src/AGENTS.md` |
| `agents/*.md` 文件 | `src/agents/AGENTS.md`（实现细节） |
| `skills/*/` 目录 | `skills/AGENTS.md` |
| `src/hooks/*/` 目录 | `src/hooks/AGENTS.md` |
| `src/tools/**/*.ts` | `src/tools/AGENTS.md` |
| `src/features/*/` 模块 | `src/features/AGENTS.md` |
| `src/tools/lsp/` | `src/tools/lsp/AGENTS.md` |
| `src/tools/diagnostics/` | `src/tools/diagnostics/AGENTS.md` |
| `src/agents/*.ts` | `src/agents/AGENTS.md` |

#### 需要更新的内容

- 发布时更新版本号
- 功能变更时更新功能描述
- 结构变更时更新文件/目录表格
- 保留"Generated"日期不变，更新"Updated"日期

### 测试要求

```bash
npm test              # 运行 Vitest 测试套件
npm run build         # TypeScript 编译
npm run lint          # ESLint 检查
npm run test:coverage # 覆盖率报告
```

### 常见模式

```typescript
// 入口点
import { createSisyphusSession } from 'ultrapower';
const session = createSisyphusSession();

// 智能体注册
import { getAgentDefinitions } from './agents/definitions';
const agents = getAgentDefinitions();

// 工具访问
import { allCustomTools, lspTools, astTools } from './tools';
```

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code CLI                          │
├─────────────────────────────────────────────────────────────┤
│                  ultrapower                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │   Skills    │   Agents    │    Tools    │   Hooks     │  │
│  │ (70 skills) │ (49 agents) │(LSP/AST/REPL)│ (35 hooks)  │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Features Layer                             ││
│  │ model-routing | boulder-state | verification | notepad  ││
│  │ delegation-categories | task-decomposer | state-manager ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 智能体概览（共 49 个）

### Build/Analysis Lane（8 个）

| 智能体 | 模型 | 用途 |
|-------|-------|---------|
| explore | haiku | 代码库发现、符号/文件映射 |
| analyst | opus | 需求分析、验收标准、隐藏约束 |
| planner | opus | 任务排序、执行计划、风险标记 |
| architect | opus | 系统设计、边界、接口、长期权衡 |
| debugger | sonnet | 根因分析、回归隔离、故障诊断 |
| executor | sonnet | 代码实现、重构、功能开发 |
| deep-executor | opus | 复杂自主目标导向任务 |
| verifier | sonnet | 完成证据、声明验证、测试充分性 |

### Review Lane（6 个）

| 智能体 | 模型 | 用途 |
|-------|-------|---------|
| style-reviewer | haiku | 格式、命名、惯用法、lint 规范 |
| quality-reviewer | sonnet | 逻辑缺陷、可维护性、反模式 |
| api-reviewer | sonnet | API 契约、版本控制、向后兼容性 |
| security-reviewer | sonnet | 漏洞、信任边界、认证/授权 |
| performance-reviewer | sonnet | 热点、复杂度、内存/延迟优化 |
| code-reviewer | opus | 跨关注点综合审查 |

### Domain Specialists（16 个）

| 智能体 | 模型 | 用途 |
|-------|-------|---------|
| dependency-expert | sonnet | 外部 SDK/API/包评估 |
| test-engineer | sonnet | 测试策略、覆盖率、不稳定测试加固 |
| quality-strategist | sonnet | 质量策略、发布就绪性、风险评估 |
| build-fixer | sonnet | 构建/工具链/类型错误修复 |
| designer | sonnet | UX/UI 架构、交互设计 |
| writer | haiku | 文档、迁移说明、用户指南 |
| qa-tester | sonnet | 交互式 CLI/服务运行时验证 |
| scientist | sonnet | 数据/统计分析 |
| document-specialist | sonnet | 外部文档与参考查找 |
| git-master | sonnet | 提交策略、历史管理 |
| vision | sonnet | 图像/截图/图表分析 |
| database-expert | sonnet | 数据库设计、查询优化和迁移 |
| devops-engineer | sonnet | CI/CD、容器化、基础设施即代码 |
| i18n-specialist | sonnet | 国际化、本地化和多语言支持 |
| accessibility-auditor | sonnet | Web 无障碍审查和 WCAG 合规 |
| api-designer | sonnet | REST/GraphQL API 设计和契约定义 |

### Coordination（1 个）

| 智能体 | 模型 | 用途 |
|-------|-------|---------|
| critic | opus | 计划/设计批判性挑战 |

### Product Lane（4 个）

| 智能体 | 模型 | 用途 |
|-------|-------|---------|
| product-manager | sonnet | 问题框架、用户画像/JTBD、PRD |
| ux-researcher | sonnet | 启发式审计、可用性、无障碍性 |
| information-architect | sonnet | 分类法、导航、可发现性 |
| product-analyst | sonnet | 产品指标、漏斗分析、实验设计 |

### 废弃别名

- `researcher` -> `document-specialist`
- `tdd-guide` -> `test-engineer`

### Axiom Lane（14 个）

| 智能体 | 模型 | 用途 |
|-------|-------|---------|
| axiom-requirement-analyst | sonnet | 需求分析三态门（PASS/CLARIFY/REJECT） |
| axiom-product-designer | sonnet | Draft PRD 生成，含 Mermaid 流程图 |
| axiom-review-aggregator | sonnet | 5 专家并行审查聚合与冲突仲裁 |
| axiom-prd-crafter | sonnet | 工程级 PRD，含门控验证 |
| axiom-system-architect | sonnet | 原子任务 DAG 与 Manifest 生成 |
| axiom-evolution-engine | sonnet | 知识收割、模式检测、工作流优化 |
| axiom-context-manager | sonnet | 7 操作记忆系统（读/写/状态/检查点） |
| axiom-worker | sonnet | PM→Worker 协议，三态输出（QUESTION/COMPLETE/BLOCKED） |
| axiom-ux-director | sonnet | UX/体验专家评审，输出 review_ux.md |
| axiom-product-director | sonnet | 产品战略专家评审，输出 review_product.md |
| axiom-domain-expert | sonnet | 领域知识专家评审，输出 review_domain.md |
| axiom-tech-lead | sonnet | 技术可行性评审，输出 review_tech.md |
| axiom-critic | sonnet | 安全/质量/逻辑评审，输出 review_critic.md |
| axiom-sub-prd-writer | sonnet | 将 Manifest 任务拆解为可执行 Sub-PRD |


## 执行模式

| 模式 | 触发词 | 用途 |
|------|---------|---------|
| autopilot | "autopilot"、"build me"、"I want a" | 完全自主执行 |
| ultrawork | "ulw"、"ultrawork" | 最大并行智能体执行 |
| ralph | "ralph"、"don't stop until" | 持续执行直到 architect 验证通过 |
| ultrapilot | "ultrapilot"、"parallel build" | 带文件所有权的并行 autopilot |
| swarm | "swarm N agents" | N 个协调智能体，使用 SQLite 任务认领 |
| pipeline | "pipeline" | 带数据传递的顺序智能体链 |

## Skills（70 个）

关键 skills：`autopilot`、`ultrawork`、`ralph`、`ultrapilot`、`plan`、`ralplan`、`deepsearch`、`deepinit`、`frontend-ui-ux`、`git-master`、`tdd`、`security-review`、`code-review`、`sciomc`、`external-context`、`analyze`、`swarm`、`pipeline`、`cancel`、`learner`、`note`、`hud`、`doctor`、`omc-setup`、`mcp-setup`、`build-fix`、`ultraqa`、`team`、`writer-memory`、`ralph-init`、`learn-about-omc`、`skill`、`trace`、`release`、`project-session-manager`、`next-step-router`、`wizard`、`ax-draft`、`ax-review`、`ax-decompose`、`ax-implement`、`ax-reflect`、`ax-rollback`、`ax-status`、`ax-suspend`、`ax-knowledge`、`ax-export`

### Superpowers Skill 系统

`superpowers/` skill 集合为高级工作流提供结构化指导：

| Skill | 用途 |
|-------|---------|
| `brainstorming` | 结构化创意探索 |
| `systematic-debugging` | 逐步根因分析 |
| `test-driven-development` | 红-绿-重构工作流 |
| `writing-plans` | 计划编写最佳实践 |
| `writing-skills` | Skill 定义编写 |
| `using-superpowers` | superpowers 系统概览 |
| `using-git-worktrees` | 使用 git worktrees 并行工作 |
| `verification-before-completion` | 基于证据的完成检查 |
| `requesting-code-review` | 如何请求有效的代码审查 |
| `receiving-code-review` | 如何处理审查反馈 |
| `dispatching-parallel-agents` | 并行智能体编排模式 |
| `executing-plans` | 计划执行纪律 |
| `finishing-a-development-branch` | 分支完成检查清单 |
| `subagent-driven-development` | 委托优先的开发工作流 |
| `next-step-router` | 关键节点路由，推荐最优下一步 skill/agent |

### Axiom Skill 系统

| Skill | 用途 |
|-------|---------|
| `ax-draft` | 生成 Draft PRD（需求起草） |
| `ax-review` | 5 专家并行评审 + 冲突仲裁 |
| `ax-decompose` | 将需求分解为原子任务 DAG |
| `ax-implement` | 执行 Axiom 任务实现流水线 |
| `ax-analyze-error` | 分析错误并生成修复方案 |
| `ax-reflect` | 任务完成后反思与知识收割 |
| `ax-rollback` | 回滚到上一个检查点 |
| `ax-status` | 查看 Axiom 工作流状态 |
| `ax-suspend` | 挂起当前工作流并保存状态 |
| `ax-knowledge` | 查询 Axiom 知识库 |
| `ax-export` | 导出 Axiom 工作流产物 |
| `ax-context` | 加载/保存 Axiom 上下文快照 |
| `ax-evolution` | 查看知识演化历史 |
| `ax-evolve` | 触发知识收割与工作流优化 |

## LSP/AST 工具

### LSP 工具

```typescript
// 通过语言服务器协议实现类 IDE 代码智能
lsp_hover              // 指定位置的类型信息
lsp_goto_definition    // 跳转到定义
lsp_find_references    // 查找所有用法
lsp_document_symbols   // 文件大纲
lsp_workspace_symbols  // 跨工作区符号搜索
lsp_diagnostics        // 单文件错误/警告
lsp_diagnostics_directory  // 项目级类型检查
lsp_servers            // 列出可用语言服务器
lsp_prepare_rename     // 检查重命名是否有效
lsp_rename             // 预览多文件重命名
lsp_code_actions       // 可用的重构/修复
lsp_code_action_resolve // 获取操作详情
```

#### 支持的语言

TypeScript、Python、Rust、Go、C/C++、Java、JSON、HTML、CSS、YAML

### AST 工具

```typescript
// 通过 ast-grep 进行结构化代码搜索/转换
ast_grep_search   // 使用元变量（$NAME、$$$ARGS）进行模式匹配
ast_grep_replace  // AST 感知的代码转换（默认为 dry-run）
```

#### 支持的语言

JavaScript、TypeScript、TSX、Python、Ruby、Go、Rust、Java、Kotlin、Swift、C、C++、C#、HTML、CSS、JSON、YAML

## 状态文件

| 路径 | 用途 |
|------|---------|
| `.omc/state/*.json` | 执行模式状态（autopilot、swarm 等） |
| `.omc/notepads/` | 计划范围的经验（学习、决策、问题） |
| `~/.omc/state/` | 全局状态 |
| `~/.claude/.omc/` | 旧版状态（自动迁移） |

## 依赖

### 运行时

| 包 | 用途 |
|---------|---------|
| `@anthropic-ai/claude-agent-sdk` | Claude Code 集成 |
| `@ast-grep/napi` | 基于 AST 的代码搜索/替换 |
| `vscode-languageserver-protocol` | LSP 类型 |
| `zod` | 运行时 schema 验证 |
| `better-sqlite3` | Swarm 任务协调 |
| `chalk` | 终端样式 |
| `commander` | CLI 解析 |

### 开发

| 包 | 用途 |
|---------|---------|
| `typescript` | 类型系统 |
| `vitest` | 测试框架 |
| `eslint` | 代码检查 |
| `prettier` | 代码格式化 |

## 命令

```bash
npm run build           # 构建 TypeScript + skill bridge
npm run dev             # 监听模式
npm test                # 运行测试
npm run test:coverage   # 覆盖率报告
npm run lint            # ESLint
npm run sync-metadata   # 同步智能体/skill 元数据
```

## Hook 系统（35 个）

`src/hooks/` 中的关键 hooks：

- `autopilot/` - 完全自主执行
- `ralph/` - 持续执行直到验证通过
- `ultrawork/` - 并行执行
- `ultrapilot/` - 带所有权的并行 autopilot
- `learner/` - Skill 提取
- `recovery/` - 错误恢复
- `rules-injector/` - 规则文件注入
- `think-mode/` - 增强推理

## 配置

`~/.claude/.omc-config.json` 中的设置：

```json
{
  "defaultExecutionMode": "ultrawork",
  "mcpServers": {
    "context7": { "enabled": true },
    "exa": { "enabled": true, "apiKey": "..." }
  }
}
```

<!-- MANUAL: Project-specific notes below this line are preserved on regeneration -->

## Axiom 系统（深度融合）

ultrapower 已深度融合 Axiom 智能体编排框架，提供完整的需求→开发→进化工作流。

### Axiom Agents（14 个）

| 智能体 | 模型 | 用途 |
|-------|-------|---------|
| axiom-requirement-analyst | sonnet | 需求三态门（PASS/CLARIFY/REJECT） |
| axiom-product-designer | sonnet | Draft PRD + Mermaid 流程图生成 |
| axiom-review-aggregator | sonnet | 5 专家并行评审 + 冲突仲裁 |
| axiom-prd-crafter | sonnet | 工程级 PRD + 门禁验证 |
| axiom-system-architect | sonnet | 原子任务 DAG + Manifest 生成 |
| axiom-evolution-engine | sonnet | 知识收割 + 模式检测 + 工作流优化 |
| axiom-context-manager | sonnet | 7 种记忆操作（读/写/状态/检查点） |
| axiom-worker | sonnet | PM→Worker 协议，三态输出（QUESTION/COMPLETE/BLOCKED） |
| axiom-ux-director | sonnet | UX/体验专家评审 |
| axiom-product-director | sonnet | 产品战略专家评审 |
| axiom-domain-expert | sonnet | 领域知识专家评审 |
| axiom-tech-lead | sonnet | 技术可行性评审 |
| axiom-critic | sonnet | 安全/质量/逻辑评审 |
| axiom-sub-prd-writer | sonnet | 将 Manifest 任务拆解为可执行 Sub-PRD |

### Axiom Worker 规范（PM→Worker 模型）

Worker agent 接收 PM 分配的原子任务，执行后输出三种格式之一：

```
## QUESTION
问题: [具体问题]
原因: [为什么需要澄清]
```

```
## COMPLETE
完成: [任务描述]
变更: [修改的文件列表]
验证: [CI 命令输出]
```

```
## BLOCKED
原因: [阻塞原因]
已尝试: [尝试过的方法]
需要: [需要什么帮助]
```

**自修复策略**：最多尝试 3 次，每次失败后运行 `tsc --noEmit && npm run build && npm test`，3 次失败后输出 BLOCKED。

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
| ax-knowledge | `/ax-knowledge` | 查询 Axiom 知识库 |
| ax-export | `/ax-export` | 导出 Axiom 工作流产物 |

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

### Axiom Hooks（2 个）

| Hook | 位置 | 用途 |
|------|------|------|
| axiom-boot | `src/hooks/axiom-boot/` | 会话启动时注入记忆上下文 |
| axiom-guards | `src/hooks/axiom-guards/` | 门禁规则执行（Expert/User/CI Gate） |

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


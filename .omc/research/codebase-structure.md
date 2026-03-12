# Ultrapower 代码库结构扫描报告

**生成时间**: 2026-03-10
**项目版本**: v6.0.0
**项目名称**: @liangjie559567/ultrapower

---

## 1. 项目概览

**描述**: Disciplined multi-agent orchestration: workflow enforcement + parallel execution

**核心特性**:
- 多 Agent 编排框架
- 工作流强制执行
- 并行执行引擎
- Hook 系统
- Skill 管理
- MCP (Model Context Protocol) 集成

**技术栈**:
- 语言: TypeScript 5.7.2
- 运行时: Node.js ≥20.0.0
- 构建工具: esbuild, tsc
- 测试框架: Vitest 4.0.17
- 包管理: npm

---

## 2. 组件清单统计

### 2.1 Agent 组件 (50 个)

**位置**: `agents/` 目录

**分类统计**:
- 核心编排 agents: explore, planner, architect, executor, debugger, verifier
- 审查通道 agents: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
- 领域专家 agents: dependency-expert, test-engineer, build-fixer, designer, writer, qa-tester, scientist, database-expert, devops-engineer, i18n-specialist, accessibility-auditor, api-designer
- 产品通道 agents: product-manager, ux-researcher, information-architect, product-analyst
- Axiom 系统 agents: axiom-context-manager, axiom-evolution-engine, axiom-critic, axiom-domain-expert, axiom-prd-crafter, axiom-product-designer, axiom-product-director, axiom-requirement-analyst, axiom-review-aggregator, axiom-sub-prd-writer, axiom-system-architect
- 协调 agents: critic, vision, git-master, document-specialist

**格式**: Markdown 提示词文件 (.md)

### 2.2 Skill 组件 (73 个)

**位置**: `skills/` 目录

**主要 Skills**:
- 工作流: autopilot, ralph, ultrawork, swarm, ultrapilot, team, pipeline, ultraqa, plan, ralplan
- Axiom 系列: ax-draft, ax-review, ax-decompose, ax-implement, ax-analyze-error, ax-reflect, ax-status, ax-suspend, ax-rollback, ax-evolution, ax-knowledge, ax-export
- 代码操作: code-review, build-fix, deepsearch, analyze, tdd
- 通知: configure-discord, configure-telegram
- 工具: cancel, note, learner, omc-setup, mcp-setup, hud, omc-doctor, omc-help, trace, release, project-session-manager, skill, writer-memory, ralph-init, learn-about-omc
- 其他: brainstorming, ccg, ccg-workflow, deepinit, dispatching-parallel-agents, executing-plans, external-context, next-step-router, plan-approval, plan-review, ralph-loop, review-plan, sciomc, team-ralph

### 2.3 Hook 系统 (304 个 TypeScript 文件)

**位置**: `src/hooks/` 目录

**功能**: 事件驱动的自动化执行系统

### 2.4 工具集 (51 个 TypeScript 文件)

**位置**: `src/tools/` 目录

**功能**: 代码智能、文件操作、状态管理等工具

### 2.5 源代码统计

**位置**: `src/` 目录

- **总 TypeScript 文件**: 962 个
- **主要子目录**:
  - `src/agents/` - Agent 定义和模板
  - `src/analytics/` - 分析模块
  - `src/audit/` - 审计系统
  - `src/cli/` - CLI 命令行接口
  - `src/commands/` - 命令实现
  - `src/compatibility/` - 兼容性层
  - `src/config/` - 配置管理
  - `src/constants/` - 常量定义
  - `src/core/` - 核心引擎
  - `src/features/` - 功能模块 (30+ 子目录)
  - `src/hooks/` - Hook 系统
  - `src/lib/` - 工具库
  - `src/tools/` - 工具集
  - `src/types/` - 类型定义

---

## 3. 目录树结构

```
ultrapower/
├── agents/                          # Agent 提示词库 (50 个)
│   ├── AGENTS.md
│   ├── analyst.md
│   ├── architect.md
│   ├── axiom-*.md                  # Axiom 系统 agents
│   ├── debugger.md
│   ├── executor.md
│   ├── verifier.md
│   └── ... (其他 agents)
│
├── skills/                          # Skill 定义 (73 个)
│   ├── AGENTS.md
│   ├── autopilot/
│   ├── ralph/
│   ├── ultrawork/
│   ├── team/
│   ├── ax-draft/
│   ├── ax-review/
│   └── ... (其他 skills)
│
├── src/                             # 源代码 (962 个 .ts 文件)
│   ├── agents/                      # Agent 定义和模板
│   │   ├── definitions.ts
│   │   ├── prompt-sections/
│   │   └── templates/
│   ├── analytics/                   # 分析模块
│   ├── audit/                       # 审计系统
│   ├── cli/                         # CLI 接口
│   │   ├── commands/
│   │   └── utils/
│   ├── commands/                    # 命令实现
│   ├── config/                      # 配置管理
│   ├── core/                        # 核心引擎
│   ├── features/                    # 功能模块 (30+ 子目录)
│   │   ├── auto-update/
│   │   ├── background-agent/
│   │   ├── boulder-state/
│   │   ├── ccg/
│   │   ├── delegation-routing/
│   │   ├── hook-execution/
│   │   ├── job-management/
│   │   ├── mcp-integration/
│   │   ├── state-machine/
│   │   ├── team-orchestration/
│   │   └── ... (其他功能)
│   ├── hooks/                       # Hook 系统 (304 个文件)
│   ├── lib/                         # 工具库
│   ├── tools/                       # 工具集 (51 个文件)
│   ├── types/                       # 类型定义
│   └── index.ts                     # 主入口
│
├── bridge/                          # MCP 服务桥接
│   ├── mcp-server.cjs
│   ├── codex-server.cjs
│   ├── gemini-server.cjs
│   └── team-bridge.cjs
│
├── commands/                        # 命令脚本
├── hooks/                           # Hook 定义
├── templates/                       # 模板文件
├── docs/                            # 文档
│   ├── standards/                   # 规范文档 (P0/P1)
│   ├── dev-standards/               # 开发规范
│   └── ... (其他文档)
│
├── tests/                           # 测试文件
├── scripts/                         # 构建脚本
├── .omc/                            # OMC 状态和研究
│   ├── state/
│   ├── research/
│   ├── plans/
│   └── axiom/
│
├── package.json                     # 项目配置
├── tsconfig.json                    # TypeScript 配置
├── CLAUDE.md                        # 项目规范
├── AGENTS.md                        # Agent 目录
└── README.md                        # 项目说明
```

---

## 4. 关键依赖关系

### 4.1 核心依赖

```
@anthropic-ai/claude-agent-sdk (^0.1.0)
  ↓
  核心 Agent 执行引擎

@modelcontextprotocol/sdk (1.27.1)
  ↓
  MCP 协议支持

better-sqlite3 (^12.6.2)
  ↓
  状态持久化存储

@ast-grep/napi (^0.41.0)
  ↓
  代码 AST 分析

@tokscale/core (^1.0.25)
  ↓
  并发控制和速率限制
```

### 4.2 模块间依赖模式

**入口点**: `src/index.ts`
  ↓
**核心引擎**: `src/core/`
  ↓
**功能模块**: `src/features/` (30+ 子模块)
  ↓
**工具集**: `src/tools/` + `src/hooks/`
  ↓
**CLI 接口**: `src/cli/`

**Agent 系统**:
- `src/agents/definitions.ts` - Agent 定义
- `agents/*.md` - Agent 提示词
- `src/agents/templates/` - 提示词模板

**Skill 系统**:
- `skills/*/` - Skill 定义
- `src/features/builtin-skills/` - 内置 Skill 实现

---

## 5. 代码组织模式

### 5.1 命名约定

**文件命名**:
- 源文件: camelCase (e.g., `agentExecutor.ts`)
- 目录: kebab-case (e.g., `hook-execution/`)
- Agent 文件: kebab-case (e.g., `axiom-context-manager.md`)

**导出模式**:
- 类: PascalCase
- 函数: camelCase
- 常量: UPPER_SNAKE_CASE

### 5.2 模块化程度

**高度模块化**:
- 功能按职责分离到 `src/features/` 子目录
- 每个 feature 包含独立的逻辑和测试
- 清晰的导入/导出边界

**关键模块**:
- `state-machine/` - 状态管理
- `team-orchestration/` - Team 编排
- `hook-execution/` - Hook 执行
- `job-management/` - 任务管理
- `mcp-integration/` - MCP 集成

### 5.3 类型系统

**位置**: `src/types/`

**特点**:
- 完整的 TypeScript 类型定义
- Zod schema 验证
- 类型安全的配置管理

---

## 6. 发现的模式和约定

### 6.1 架构模式

1. **分层架构**
   - CLI 层 → 命令层 → 核心引擎 → 功能模块 → 工具层

2. **事件驱动**
   - Hook 系统支持 15+ 事件类型
   - 自动化工作流触发

3. **状态机**
   - Agent 生命周期管理
   - Team Pipeline 状态转换
   - 持久化状态存储

4. **并行执行**
   - 多 Agent 并行编排
   - 任务队列管理
   - 速率限制控制

### 6.2 设计约定

1. **安全规则** (P0)
   - 路径遍历防护
   - Hook 输入消毒
   - 状态文件权限管理

2. **工作流强制**
   - 分阶段 Pipeline (plan → prd → exec → verify → fix)
   - 门禁规则 (Expert Gate, User Gate, CI Gate, Scope Gate)
   - 循环控制和超时管理

3. **配置管理**
   - `.omc/` 目录存储状态
   - `CLAUDE.md` 项目规范
   - `AGENTS.md` Agent 目录

### 6.3 文档体系

**规范文档** (`docs/standards/`):
- P0: runtime-protection.md, hook-execution-order.md, state-machine.md, agent-lifecycle.md
- P1: user-guide.md, anti-patterns.md, contribution-guide.md

**开发规范** (`docs/dev-standards/`):
- dev-standards.md
- context-collection.md
- sufficiency-checklist.md
- workflow.md
- tools-integration.md
- quality-review.md

---

## 7. 关键文件清单

| 文件 | 用途 |
|------|------|
| `src/index.ts` | 主入口点 |
| `src/core/` | 核心引擎 |
| `src/agents/definitions.ts` | Agent 定义 |
| `src/features/state-machine/` | 状态管理 |
| `src/features/team-orchestration/` | Team 编排 |
| `src/features/hook-execution/` | Hook 执行 |
| `src/cli/index.ts` | CLI 入口 |
| `package.json` | 项目配置 |
| `CLAUDE.md` | 项目规范 |
| `AGENTS.md` | Agent 目录 |
| `docs/standards/` | 规范文档 |

---

## 8. 构建和发布

**构建流程**:
```bash
npm run build
  ↓
tsc (TypeScript 编译)
  ↓
parallel-build.mjs (并行构建)
  ↓
compose-docs.mjs (文档合成)
```

**发布配置**:
- 主入口: `dist/index.js`
- 类型定义: `dist/index.d.ts`
- CLI 命令: ultrapower, omc, omc-cli, omc-analytics
- 包含文件: dist, agents, bridge, commands, hooks, skills, templates, docs

---

## 9. 总结

**项目规模**:
- 962 个 TypeScript 源文件
- 50 个 Agent 定义
- 73 个 Skill 定义
- 304 个 Hook 文件
- 51 个工具文件

**核心特性**:
- 完整的多 Agent 编排框架
- 强大的工作流强制系统
- 灵活的 Hook 事件系统
- 丰富的 Skill 库
- MCP 协议集成
- Axiom 进化引擎

**架构优势**:
- 高度模块化设计
- 清晰的职责分离
- 完善的类型系统
- 详细的规范文档
- 安全性优先


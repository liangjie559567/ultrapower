# Ultrapower 项目深度研究报告 (Part 1/4)

**生成时间:** 2026-03-03
**项目版本:** v5.5.11
**分析范围:** 完整代码库架构、技术栈、模块设计

---

## 1. 项目概览

### 1.1 核心定位

Ultrapower 是一个**多 Agent 编排框架**，为 Claude Code 提供:

* 49 个专业 Agent (覆盖开发、审查、产品、领域专家)

* 71 个 Skill 工作流

* 47 个 Hook 事件驱动系统

* 35 个自定义工具 (LSP/AST/Python REPL)

### 1.2 技术栈清单

**核心技术:**

* **语言:** TypeScript 5.7.2 (ES2022, strict mode)

* **运行时:** Node.js ≥20.0.0

* **模块系统:** ESM (type: "module")

* **构建工具:** TypeScript compiler + esbuild

* **测试框架:** Vitest 4.0.17

* **代码质量:** ESLint 9.17 + Prettier 3.4

**关键依赖 (生产):**
```json
{
  "@anthropic-ai/claude-agent-sdk": "^0.1.0",    // Claude Agent 集成
  "@modelcontextprotocol/sdk": "^1.26.0",        // MCP 协议
  "@ast-grep/napi": "^0.31.0",                   // AST 代码搜索
  "better-sqlite3": "^12.6.2",                   // 本地数据库
  "commander": "^12.1.0",                        // CLI 框架
  "zod": "^3.23.8",                              // 数据验证
  "vscode-languageserver-protocol": "^3.17.5"   // LSP 支持
}
```

### 1.3 项目规模指标

| 指标 | 数量 |
| ------ | ------ |
| 总代码行数 | ~50,000+ 行 (估算) |
| TypeScript 文件 | 200+ 个 |
| Agent 定义 | 49 个 |
| Skill 实现 | 71 个 |
| Hook 类型 | 47 个 |
| MCP 工具 | 35 个 |
| CLI 命令 | 20+ 个 |

---

## 2. 架构设计分析

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   Claude Code CLI                       │
├─────────────────────────────────────────────────────────┤
│                    Ultrapower                           │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │ Skills   │ Agents   │  Tools   │  Hooks   │         │
│  │ (71)     │ (49)     │ (35)     │ (47)     │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│  ┌─────────────────────────────────────────────┐       │
│  │         Features Layer                      │       │
│  │ • model-routing  • boulder-state            │       │
│  │ • verification   • notepad                  │       │
│  │ • delegation     • task-decomposer          │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心模块职责

**1. Agents 系统 (`src/agents/`)**

* **职责:** 定义 49 个专业 Agent 的系统提示词和能力

* **关键文件:**
  - `definitions.ts` - Agent 定义和元数据
  - `index.ts` - Agent 注册和导出

* **设计模式:** 工厂模式 + 策略模式

**2. Features 层 (`src/features/`)**

* **职责:** 核心功能模块化

* **子模块:**
  - `boulder-state/` - 状态持久化 (Ralph/Ultrawork)
  - `delegation-enforcer/` - 委派规则强制执行
  - `context-injector/` - 上下文注入
  - `magic-keywords/` - 关键词检测和路由
  - `auto-update/` - 自动版本检查

**3. Hooks 系统 (`src/hooks/`)**

* **职责:** 事件驱动架构

* **Hook 类型:** 15 种 (UserPromptSubmit, ToolUse, SessionStart 等)

* **执行顺序:** 严格定义的优先级系统

* **关键文件:** `bridge.ts` - Hook 输入消毒和路由

**4. Team 协调 (`src/team/`)**

* **职责:** 多 Agent 任务管理和协调

* **核心组件:**
  - `unified-team.ts` - Team 生命周期管理
  - `task-router.ts` - 任务路由和分配
  - `stage-pipeline.ts` - 分阶段流水线

* **状态机:** 5 阶段 (plan → prd → exec → verify → fix)

**5. MCP 服务器 (`src/mcp/`)**

* **职责:** 模型上下文协议集成

* **服务器:**
  - `omc-tools-server.ts` - 35 个自定义工具
  - `codex-server.ts` - OpenAI Codex 桥接
  - `gemini-server.ts` - Google Gemini 桥接

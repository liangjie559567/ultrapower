<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-31 -->

# src

ultrapower 的 TypeScript 源代码 - 驱动多 agent 编排的核心库。

## 用途

此目录包含按模块组织的所有 TypeScript 源代码：

- **agents/** - 38 个专业 AI agent 定义，含分级变体
- **tools/** - 15 个 LSP/AST/REPL 工具，提供类 IDE 能力
- **hooks/** - 35 个事件驱动行为，用于执行模式
- **features/** - 核心功能（模型路由、状态管理、验证）
- **config/** - 配置加载与验证
- **commands/** - 命令扩展工具
- **mcp/** - MCP server 集成

## 关键文件

| 文件 | 描述 |
|------|------|
| `index.ts` | 主入口 - 导出 `createSisyphusSession()` |
| `shared/types.ts` | 跨模块共享的 TypeScript 类型 |

## 子目录

| 目录 | 用途 |
|------|------|
| `agents/` | 32 个 agent 定义，含提示词和工具（见 `agents/AGENTS.md`） |
| `tools/` | 15 个 LSP、AST 和 Python REPL 工具（见 `tools/AGENTS.md`） |
| `hooks/` | 31 个执行模式 hook（见 `hooks/AGENTS.md`） |
| `features/` | 核心功能，如模型路由、状态（见 `features/AGENTS.md`） |
| `config/` | 配置加载（`loader.ts`） |
| `commands/` | 命令扩展工具 |
| `mcp/` | MCP server 配置 |
| `cli/` | CLI 入口（`index.ts`、`analytics.ts`） |
| `hud/` | 抬头显示组件 |
| `installer/` | 安装系统 |
| `analytics/` | 使用分析收集 |
| `__tests__/` | 测试文件 |

## 面向 AI Agent

### 在此目录中工作

1. **模块组织**：每个主要功能都有自己的目录，包含：
   - `index.ts` - 主导出
   - `types.ts` - TypeScript 接口
   - 按需添加的支持文件

2. **入口模式**：
   ```typescript
   // index.ts 中的主导出
   export { createSisyphusSession } from './session';
   export { lspTools, astTools, allCustomTools } from './tools';
   export { getAgentDefinitions, omcSystemPrompt } from './agents/definitions';
   ```

3. **工具注册**：自定义工具在 `tools/index.ts` 中注册：

   ```typescript
   export const allCustomTools = [
     ...lspTools,      // 12 个 LSP 工具
     ...astTools,      // 2 个 AST 工具
     pythonReplTool    // 1 个 REPL 工具（共 15 个）
   ];
   ```

4. **Agent 注册**：Agent 在 `agents/definitions.ts` 中定义：
   ```typescript
   export function getAgentDefinitions(): Record<string, AgentConfig> {
     return {
       architect: architectAgent,
       executor: executorAgent,
       // ... 全部 32 个 agent
     };
   }
   ```

### 测试要求

- 测试文件位于 `__tests__/`，命名模式为 `*.test.ts`
- 运行 `npm test -- --grep "module-name"` 测试特定模块
- 修改后用 `npm run build` 验证类型安全
- 使用 `lsp_diagnostics_directory` 工具进行全项目类型检查

### 常见模式

#### 创建新 Agent

1. 在 `agents/` 中添加 agent 文件（如 `new-agent.ts`）
2. 从 `agents/index.ts` 导出
3. 在 `agents/definitions.ts` 的 `getAgentDefinitions()` 中添加
4. 在 `/agents/new-agent.md` 创建提示词模板
5. 更新 `docs/REFERENCE.md`（Agents 部分）添加新 agent

#### 添加新 Hook

1. 在 `hooks/` 中创建目录（如 `new-hook/`）
2. 添加 `index.ts`、`types.ts`、`constants.ts`
3. 从 `hooks/index.ts` 导出
4. 更新 `docs/REFERENCE.md`（Hooks System 部分）添加新 hook

#### 添加新工具

1. 用 Zod schema 创建工具定义
2. 添加到对应工具文件（`lsp-tools.ts`、`ast-tools.ts`）
3. 从 `tools/index.ts` 导出
4. 如果是面向用户的工具，更新 `docs/REFERENCE.md`

#### 添加新功能

1. 在 `features/` 中创建功能目录
2. 从 `features/index.ts` 导出
3. 用 API 文档更新 `docs/FEATURES.md`

#### TypeScript 规范

- 使用严格模式（`noImplicitAny`、`strictNullChecks`）
- 公共 API 优先使用接口而非类型别名
- 每个模块使用桶导出（`index.ts`）
- 文件大小：通常 200-400 行，最多 800 行
- 使用 Zod 进行运行时输入验证（见 `templates/rules/coding-style.md`）

## 依赖

### 内部
- 使用 `shared/types.ts` 中的类型
- 从 `/agents/*.md` 导入 agent 提示词
- 从 `/skills/*.md` 加载 skill

### 外部

各模块关键包：`zod`（tools、features），`@ast-grep/napi`（tools/ast），`vscode-languageserver-protocol`（tools/lsp），`better-sqlite3`（hooks/swarm），`chalk`（cli、hud）。完整依赖列表见根目录 AGENTS.md。

## 模块依赖图

```
index.ts
├── agents/definitions.ts → agents/*.ts → /agents/*.md (提示词)
├── tools/index.ts
│   ├── lsp-tools.ts → lsp/*.ts
│   ├── ast-tools.ts
│   └── python-repl/
├── hooks/index.ts → hooks/*/*.ts
├── features/index.ts
│   ├── model-routing/
│   ├── boulder-state/
│   ├── verification/
│   └── ...
├── config/loader.ts
└── mcp/servers.ts
```

<!-- MANUAL: -->

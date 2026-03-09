<!-- Generated: 2026-01-28 | Updated: 2026-03-05 -->

# src/ - TypeScript 源代码结构

**用途：** ultrapower 核心库的 TypeScript 实现。包含智能体、技能、工具、钩子和执行引擎。

**版本：** 5.5.14

## 关键文件

| 文件               | 描述                                                  |
| ------------------ | ----------------------------------------------------- |
| `index.ts`         | 主入口点 - 导出 `createSisyphusSession()` 和核心 API |
| `cli/index.ts`     | CLI 命令处理器                                        |
| `core/`            | 执行引擎、状态管理、模型路由                          |
| `agents/definitions.ts` | 50 个智能体的定义和提示词                        |
| `skills/index.ts`  | 71 个 skills 的注册表                                 |
| `hooks/index.ts`   | 47 个 hooks 的注册表和路由                            |
| `tools/index.ts`   | 35 个自定义工具的导出                                 |
| `team/`            | Team 流水线实现                                       |
| `features/`        | 功能层（模型路由、验证、状态管理）                    |

## 子目录表

| 目录        | 文件数 | 用途                         | 相关 AGENTS.md           |
| ----------- | ------ | ---------------------------- | ------------------------ |
| `agents/`   | 25+    | 智能体定义、提示词、超时配置 | `src/agents/AGENTS.md`   |
| `skills/`   | 15+    | Skill 执行引擎、注册表       | -                        |
| `hooks/`    | 40+    | Hook 类型、路由、执行器      | `src/hooks/AGENTS.md`    |
| `tools/`    | 20+    | LSP、AST、诊断、自定义工具   | `src/tools/AGENTS.md`    |
| `features/` | 15+    | 模型路由、验证、状态管理     | `src/features/AGENTS.md` |
| `team/`     | 10+    | Team 流水线、阶段管理        | -                        |
| `core/`     | 12+    | 执行引擎、会话管理           | -                        |
| `commands/` | 8+     | CLI 命令实现                 | -                        |
| `lib/`      | 20+    | 工具函数、验证、路径处理     | -                        |
| `mcp/`      | 8+     | MCP 服务器集成               | -                        |

## 面向 AI 智能体

### 在此目录中工作

1. **代码修改**：使用 `executor` 或 `deep-executor`
   * 实现新功能、修复 bug、重构
   * 运行 `npm run build && npm test` 验证

1. **代码分析**：使用 LSP/AST 工具
   * `lsp_workspace_symbols` - 查找符号定义
   * `ast_grep_search` - 结构化代码搜索
   * `lsp_diagnostics_directory` - 类型检查

1. **架构决策**：使用 `architect` 或 `analyst`
   * 跨模块影响分析
   * 设计新功能时参考 `src/features/` 和 `src/team/`

### 修改检查清单

修改以下位置时，更新对应的 AGENTS.md：

| 修改位置              | 更新 AGENTS.md           |
| --------------------- | ------------------------ |
| `src/agents/*.ts`     | `src/agents/AGENTS.md`   |
| `src/hooks/*`         | `src/hooks/AGENTS.md`    |
| `src/tools/**/*.ts`   | `src/tools/AGENTS.md`    |
| `src/features/*/`     | `src/features/AGENTS.md` |
| 新增模块或文件        | 本文件 (src/AGENTS.md)   |

### 常见任务

```typescript
// 查找智能体定义
import { getAgentDefinitions } from './agents/definitions';
const agents = getAgentDefinitions();

// 注册新 skill
import { registerSkill } from './skills';
registerSkill('my-skill', skillDefinition);

// 添加新 hook
import { registerHook } from './hooks';
registerHook('my-hook', hookHandler);

// 使用工具
import { lspTools, astTools } from './tools';
```

### 测试

```bash
npm test                    # 运行 Vitest
npm run build              # TypeScript 编译
npm run lint               # ESLint 检查
npm run test:coverage      # 覆盖率报告
```

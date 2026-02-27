<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/mcp/

## Purpose
MCP（Model Context Protocol）服务器实现层。包含主工具服务器、Codex/Gemini 代理服务器、任务管理和提示注入等核心 MCP 功能。构建产物输出到 `bridge/` 目录。

## Key Files

| 文件 | 描述 |
|------|------|
| `omc-tools-server.ts` | 主 MCP 工具服务器，暴露 35 个自定义工具 |
| `codex-server.ts` | Codex（OpenAI）MCP 代理服务器 |
| `codex-core.ts` | Codex 核心逻辑（请求处理、响应格式化） |
| `gemini-server.ts` | Gemini（Google）MCP 代理服务器 |
| `gemini-core.ts` | Gemini 核心逻辑 |
| `standalone-server.ts` | 独立 MCP 服务器（无代理模式） |
| `job-management.ts` | 后台任务管理（创建、查询、等待） |
| `job-state-db.ts` | 任务状态持久化（SQLite） |
| `prompt-injection.ts` | 提示注入机制 |
| `prompt-persistence.ts` | 提示持久化存储 |
| `mcp-config.ts` | MCP 服务器配置管理 |
| `servers.ts` | 服务器注册和路由 |
| `shared-exec.ts` | 共享执行上下文 |
| `index.ts` | 模块导出入口 |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `__tests__/` | MCP 服务器单元测试 |

## For AI Agents

### 工具注册规范
在 `omc-tools-server.ts` 中注册新工具时：
1. 定义工具 schema（名称、描述、参数）
2. 实现处理函数
3. 在 `src/tools/index.ts` 中导出
4. 更新 `docs/REFERENCE.md` 的 MCP 工具部分

### 构建
```bash
npm run build  # 生成 bridge/mcp-server.cjs
```

### 修改此目录时
- 修改工具定义后更新 `docs/REFERENCE.md`
- 修改 Codex/Gemini 服务器后更新对应的 `bridge/*.cjs`
- 新增工具需同步更新根目录 `AGENTS.md` 的工具计数

## Dependencies

### Internal
- `src/tools/` — 工具实现（被 omc-tools-server.ts 调用）
- `src/features/` — 特性层（状态管理、模型路由等）
- `bridge/` — 构建产物输出目录

### External
- `@modelcontextprotocol/sdk` — MCP 协议
- `better-sqlite3` — 任务状态持久化

<!-- MANUAL: -->

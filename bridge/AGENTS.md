<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# bridge/

## Purpose
包含预打包的 MCP（Model Context Protocol）服务器，用于插件分发。这些 `.cjs` 文件是构建产物，由 `scripts/build-*.mjs` 脚本生成，供 Claude Code 插件系统加载。

## Key Files

| 文件 | 描述 |
|------|------|
| `mcp-server.cjs` | 主 MCP 工具服务器（LSP、AST、Python REPL、状态工具等） |
| `codex-server.cjs` | Codex（OpenAI）MCP 代理服务器 |
| `gemini-server.cjs` | Gemini（Google）MCP 代理服务器 |
| `team-bridge.cjs` | Team 协调 MCP 桥接服务器 |
| `gyoshu_bridge.py` | Python 桥接脚本（辅助工具） |
| `run-mcp-server.sh` | MCP 服务器启动脚本 |

## For AI Agents

### 重要：这是构建产物目录
- **不要直接编辑** `.cjs` 文件，它们由构建脚本生成
- 修改 MCP 服务器逻辑应在 `src/mcp/` 中进行
- 运行 `npm run build` 重新生成这些文件

### 构建来源映射
| 产物文件 | 源文件 |
|---------|--------|
| `mcp-server.cjs` | `src/mcp/omc-tools-server.ts` + `scripts/build-mcp-server.mjs` |
| `codex-server.cjs` | `src/mcp/codex-server.ts` + `scripts/build-codex-server.mjs` |
| `gemini-server.cjs` | `src/mcp/gemini-server.ts` + `scripts/build-gemini-server.mjs` |
| `team-bridge.cjs` | `src/team/` + `scripts/build-bridge-entry.mjs` |

### 修改此目录时
- 修改 `src/mcp/` 后运行 `npm run build` 重新生成
- 提交时包含更新后的 `.cjs` 文件（它们是发布产物）
- 更新 `docs/REFERENCE.md` 中的 MCP 工具部分

## Dependencies

### Internal
- `src/mcp/` — MCP 服务器源代码
- `src/team/` — Team 桥接源代码
- `scripts/build-*.mjs` — 构建脚本

### External
- `@modelcontextprotocol/sdk` — MCP 协议实现
- `esbuild` — 打包工具

<!-- MANUAL: -->

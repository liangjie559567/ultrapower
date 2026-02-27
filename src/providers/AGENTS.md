<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/providers/

## Purpose
AI 提供商抽象层。统一封装不同 AI 提供商（Claude、Codex、Gemini）的 API 调用接口，提供一致的请求/响应格式。

## For AI Agents

### 提供商路由
- Claude（默认）：直接通过 Claude Code SDK
- Codex：通过 `src/mcp/codex-core.ts`
- Gemini：通过 `src/mcp/gemini-core.ts`

### 修改此目录时
- 新增提供商需更新 `src/mcp/servers.ts` 的路由配置
- 修改 API 调用格式需同步更新 `docs/REFERENCE.md`

## Dependencies

### Internal
- `src/mcp/` — MCP 代理服务器
- `src/features/model-routing/` — 模型路由决策

<!-- MANUAL: -->

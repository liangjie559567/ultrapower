<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# agents.codex/

## Purpose
Codex agent 提示词定义目录。存放所有 OMC agent 角色的 Markdown 提示词文件，供 Codex MCP 服务器加载使用。包含 49 个 agent 角色定义，涵盖构建/分析、审查、领域专家、产品和 Axiom 通道。

## Key Files

| File | Description |
|------|-------------|
| `executor.md` | 代码实现 agent 提示词 |
| `deep-executor.md` | 复杂自主执行 agent 提示词 |
| `architect.md` | 系统架构 agent 提示词 |
| `planner.md` | 任务规划 agent 提示词 |
| `debugger.md` | 根因分析 agent 提示词 |
| `verifier.md` | 完成验证 agent 提示词 |
| `code-reviewer.md` | 综合代码审查 agent 提示词 |
| `security-reviewer.md` | 安全审查 agent 提示词 |
| `CONVERSION-GUIDE.md` | Agent 提示词格式转换指南 |
| *(其余 40+ 个 agent 提示词文件)* | 各专业 agent 角色定义 |

## For AI Agents

### 修改此目录时
- 与 `agents/` 目录保持同步（`agents/` 是主定义，此目录是 Codex 专用副本）
- 参见 `CONVERSION-GUIDE.md` 了解格式转换规范

## Dependencies

### Internal
- `agents/` — Agent 提示词主定义目录
- `src/mcp/codex-server.ts` — Codex MCP 服务器

<!-- MANUAL: -->

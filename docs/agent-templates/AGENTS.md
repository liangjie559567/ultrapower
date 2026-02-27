<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# docs/agent-templates/

## Purpose
Agent 模板文档目录。存放 agent 提示词设计规范和层级指令模板，指导如何为不同复杂度的任务设计 agent 提示词。

## Key Files

| File | Description |
|------|-------------|
| `base-agent.md` | 基础 agent 提示词模板规范 |
| `README.md` | 模板使用说明 |
| `tier-instructions.md` | 分层指令设计规范（haiku/sonnet/opus 层级） |

## For AI Agents

### 修改此目录时
- 模板变更需同步更新 `src/agents/templates/`
- 参见 `agents/` 目录了解实际 agent 定义

## Dependencies

### Internal
- `src/agents/templates/` — TypeScript 模板实现
- `agents/` — Agent 提示词定义

<!-- MANUAL: -->

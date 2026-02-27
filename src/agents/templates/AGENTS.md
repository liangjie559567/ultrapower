<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/agents/templates/

## Purpose
Agent 提示词模板目录。存放用于生成 agent 系统提示词的 Markdown 模板，包括探索模板和实现模板，供 agent 定义系统动态组合使用。

## Key Files

| File | Description |
|------|-------------|
| `exploration-template.md` | 探索类 agent 的提示词模板（explore、debugger 等） |
| `implementation-template.md` | 实现类 agent 的提示词模板（executor、deep-executor 等） |

## For AI Agents

### 修改此目录时
- 模板变更会影响所有使用该模板的 agent 行为
- 参见 `src/agents/prompt-sections/` 了解可组合的提示词片段

## Dependencies

### Internal
- `src/agents/` — Agent 定义系统
- `src/agents/prompt-sections/` — 提示词片段

<!-- MANUAL: -->

<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/notepad-wisdom/

## Purpose
Notepad 智慧提取模块。分析 notepad 中积累的工作记忆，提取可复用的模式和最佳实践，为 agent 决策提供历史经验支持。

## For AI Agents

### 修改此目录时
- 与 `src/hooks/memory/` 协调，避免重复处理
- 提取的智慧应存入 `project-memory.json` 的 notes 章节

## Dependencies

### Internal
- `src/tools/notepad-tools.ts` — Notepad 读取
- `src/tools/memory-tools.ts` — 项目记忆写入

<!-- MANUAL: -->

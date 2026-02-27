<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/context-injector/

## Purpose
上下文注入模块。在 agent 执行前自动注入相关上下文（项目记忆、notepad 优先内容、Axiom 状态等），确保 agent 有足够的背景信息。

## For AI Agents

### 注入内容
- Notepad 优先上下文（≤500字符）
- 项目记忆相关章节
- Axiom 活跃上下文（若存在）
- 当前执行模式状态

### 修改此目录时
- 注入内容变更需测试对 agent 行为的影响
- 注入量需控制在合理范围内，避免上下文溢出

## Dependencies

### Internal
- `src/tools/notepad-tools.ts` — Notepad 读取
- `src/tools/memory-tools.ts` — 项目记忆读取

<!-- MANUAL: -->

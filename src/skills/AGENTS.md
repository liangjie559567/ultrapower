<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/skills/

## Purpose
Skill 系统的 TypeScript 实现层。包含 skill 加载器、内置 skill 定义和 skill 执行运行时。与 `skills/` 目录（Markdown 定义）配合工作。

## For AI Agents

### Skills 架构
- `skills/*/SKILL.md` — Markdown 格式的 skill 定义（用户可见）
- `src/skills/` — TypeScript 运行时实现
- `src/features/builtin-skills/` — 内置 skill 注册

### 修改此目录时
- 新增 skill 需同时在 `skills/` 创建 Markdown 定义
- 修改 skill 加载逻辑后运行 `npm test`

## Dependencies

### Internal
- `skills/` — Skill Markdown 定义文件
- `src/features/builtin-skills/` — 内置 skill 注册表

<!-- MANUAL: -->

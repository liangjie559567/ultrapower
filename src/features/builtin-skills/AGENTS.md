<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/builtin-skills/

## Purpose
内置 skill 注册模块。管理 ultrapower 预置的核心 skill 列表，提供 skill 发现和加载接口，是 skill 系统的注册中心。

## For AI Agents

### 修改此目录时
- 新增内置 skill 需同时在 `skills/` 创建对应目录
- 删除 skill 需更新 `docs/REFERENCE.md` 的 Skills 部分
- 参见 `skills/AGENTS.md` 了解 skill 目录结构

## Dependencies

### Internal
- `skills/` — Skill Markdown 定义文件
- `src/skills/` — Skill 运行时实现

<!-- MANUAL: -->

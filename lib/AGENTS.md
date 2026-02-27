<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# lib/

## Purpose
共享工具库目录，包含跨模块复用的核心工具。目前包含 brainstorm-server（头脑风暴 MCP 服务器）和 skills-core.js（skill 核心运行时）。

## Key Files

| 文件 | 描述 |
|------|------|
| `skills-core.js` | Skill 核心运行时，提供 skill 加载和执行基础设施 |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `brainstorm-server/` | 头脑风暴 MCP 服务器实现 |

## For AI Agents

### 修改此目录时
- `skills-core.js` 是 skill 系统的基础，修改需谨慎
- 修改后运行完整测试套件：`npm test`
- `brainstorm-server/` 是独立的 MCP 服务器，有自己的依赖

## Dependencies

### Internal
- `src/skills/` — 使用 skills-core.js 的 skill 实现
- `bridge/` — 可能引用 lib 中的工具

<!-- MANUAL: -->

<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# templates/

## Purpose
项目模板目录。存放用于初始化新项目或环境的配置模板，包括 Axiom 工作流模板、Hook 脚本模板和规则模板，供 `omc install` 时复制到目标项目。

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `axiom/` | Axiom 工作流配置模板（见 `axiom/AGENTS.md`） |
| `hooks/` | Hook 脚本模板（见 `hooks/AGENTS.md`） |
| `rules/` | 规则文件模板（见 `rules/AGENTS.md`） |

## For AI Agents

### 修改此目录时
- 模板变更会影响所有新安装的项目
- 参见 `src/installer/` 了解模板复制逻辑

## Dependencies

### Internal
- `src/installer/` — 安装管理模块

<!-- MANUAL: -->

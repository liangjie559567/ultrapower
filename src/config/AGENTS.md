<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/config/

## Purpose
配置管理模块。处理 ultrapower 配置文件的加载、验证和访问，包括 Axiom 配置和全局 OMC 配置。

## Key Files

| 文件 | 描述 |
|------|------|
| `index.ts` | 配置模块导出入口 |
| `loader.ts` | 配置文件加载器（读取 `~/.claude/.omc-config.json`） |
| `axiom-config.ts` | Axiom 系统专用配置（读取 `.omc/axiom/` 目录） |

## For AI Agents

### 配置文件位置
- 全局配置：`~/.claude/.omc-config.json`
- Axiom 配置：`{worktree}/.omc/axiom/`
- 项目记忆：`{worktree}/.omc/project-memory.json`

### 修改此目录时
- 新增配置项需更新 `docs/REFERENCE.md` 的配置部分
- 配置 schema 变更需考虑向后兼容性
- 参见 `docs/MIGRATION.md` 了解配置迁移规范

## Dependencies

### Internal
- `src/utils/config-dir.ts` — 配置目录定位
- `src/features/` — 消费配置的特性模块

<!-- MANUAL: -->

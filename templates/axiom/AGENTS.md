<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# templates/axiom/

## Purpose
Axiom 工作流配置模板目录。存放 Axiom 系统的初始化模板，包括任务执行脚本和 DAG 分析文档，供新项目安装 Axiom 时使用。

## Key Files

| File | Description |
|------|-------------|
| `dag-analysis.md` | DAG 任务依赖分析模板 |
| `task-execution.md` | 任务执行流程模板 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `scripts/` | Axiom 初始化脚本模板 |

## For AI Agents

### 修改此目录时
- 参见 `src/hooks/axiom-boot/` 了解 Axiom 启动流程

## Dependencies

### Internal
- `src/hooks/axiom-boot/` — Axiom 启动 hook

<!-- MANUAL: -->

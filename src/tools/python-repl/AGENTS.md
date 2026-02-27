<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/tools/python-repl/

## Purpose
Python REPL 工具实现。提供持久化的 Python 交互式环境，支持 pandas、numpy、matplotlib 等数据分析库，用于数据处理和科学计算任务。

## For AI Agents

### 使用场景
- CSV/JSON 数据分析
- 统计计算
- 数据可视化准备
- 文件内容处理

### 重要规则
- 本地文件分析必须使用此工具，不能使用分析工具（无法访问本地文件）
- 状态在同一会话内持久化

### 修改此目录时
- 支持的库变更需更新 `docs/REFERENCE.md` 的 Python REPL 部分

## Dependencies

### External
- `pandas` — 数据分析
- `numpy` — 数值计算
- `matplotlib` — 数据可视化

<!-- MANUAL: -->

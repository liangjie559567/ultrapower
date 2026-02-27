<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/task-decomposer/

## Purpose
任务分解模块。将复杂任务自动拆解为可并行执行的原子子任务，生成依赖图和执行顺序，支持 ultrawork 和 team 模式的任务分配。

## For AI Agents

### 分解策略
- 识别独立任务（可并行）
- 识别依赖任务（需顺序执行）
- 生成 DAG（有向无环图）

### 修改此目录时
- 分解算法变更需测试复杂依赖场景
- 参见 `agents/planner.md` 了解 planner agent 的分解策略

## Dependencies

### Internal
- `agents/planner.md` — Planner agent（使用此模块）
- `src/features/delegation-categories/` — 委派分类

<!-- MANUAL: -->

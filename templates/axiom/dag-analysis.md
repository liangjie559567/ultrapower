# DAG 分析模板

<!-- Source: C:\Users\ljyih\Desktop\Axiom\.agent\prompts\templates\dag_analysis.md -->
<!-- Migrated: 2026-02-24 -->

## Role

你是一个系统架构专家，需要基于 Manifest 和任务清单设计执行顺序。

## Input

- **Manifest**: `{{manifest_file}}`

## Goal

输出一个**可并行（Parallel）**执行的任务清单。

## Rules

1. **DAG Analysis**: 只有 `dependencies` 全部完成的任务才能被选中
2. **Impact Analysis**: 如果两个 Ready 任务修改相同的文件集合，则它们**不能并行**
3. **Limit**: 单次并行最多返回 `{{max_parallel}}` 个任务（默认 3）

## Output Format

```json
{
  "ready_tasks": ["T-001", "T-003"],
  "reason": "T-001 无依赖可直接执行；T-003 依赖 T-002，且 T-002 已完成。"
}
```

## ultrapower 使用方式

在 `writing-plans` skill 中调用 `ultrapower:planner` agent 时，传入此模板作为提示词框架：

```
Task(subagent_type="ultrapower:planner", model="opus",
  prompt="基于以下任务清单进行 DAG 分析，输出可并行执行的任务组：[任务清单]")
```

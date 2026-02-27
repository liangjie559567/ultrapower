<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/background-agent/

## Purpose
后台 agent 管理模块。支持以非阻塞方式启动 agent 任务，通过任务 ID 查询状态，实现长时间运行任务的异步执行。

## For AI Agents

### 后台任务工作流
```
Task(run_in_background=true) → 获取 task_id → check_job_status(task_id) → wait_for_job(task_id)
```

### 修改此目录时
- 最大并发数限制：20 个后台任务
- 参见 `src/mcp/job-management.ts` 了解任务管理实现

## Dependencies

### Internal
- `src/mcp/job-management.ts` — 任务管理
- `src/mcp/job-state-db.ts` — 任务状态持久化

<!-- MANUAL: -->

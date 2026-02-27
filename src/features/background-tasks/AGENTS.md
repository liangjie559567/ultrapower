<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/background-tasks/

## Purpose
后台任务调度模块。管理长时间运行的后台任务队列，提供任务状态查询、取消和结果收集接口。

## For AI Agents

### 修改此目录时
- 与 `src/features/background-agent/` 协调，避免功能重叠
- 参见 `src/mcp/job-management.ts` 了解底层实现

## Dependencies

### Internal
- `src/features/background-agent/` — 后台 agent 管理
- `src/mcp/job-management.ts` — 任务管理

<!-- MANUAL: -->

<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/team/

## Purpose
Claude Code 原生 Team 协调层实现。管理多 agent 团队的生命周期、任务路由、消息传递、健康监控和状态持久化。是 ultrapower Team 模式的核心实现。

## Key Files

| 文件 | 描述 |
|------|------|
| `unified-team.ts` | 统一 Team 接口，整合所有 Team 功能 |
| `task-router.ts` | 任务路由，将任务分配给合适的 agent |
| `message-router.ts` | 消息路由，处理 agent 间通信 |
| `team-registration.ts` | Team 成员注册和发现 |
| `team-status.ts` | Team 状态查询和报告 |
| `worker-health.ts` | Worker agent 健康监控 |
| `worker-restart.ts` | Worker 故障恢复和重启 |
| `heartbeat.ts` | 心跳机制，检测 agent 存活 |
| `inbox-outbox.ts` | 消息收发队列管理 |
| `outbox-reader.ts` | 出站消息读取器 |
| `activity-log.ts` | Team 活动日志记录 |
| `audit-log.ts` | 审计日志（安全相关操作） |
| `capabilities.ts` | Agent 能力声明和查询 |
| `permissions.ts` | Team 权限管理 |
| `merge-coordinator.ts` | 并行任务结果合并协调 |
| `git-worktree.ts` | Git worktree 管理（隔离执行环境） |
| `tmux-session.ts` | tmux 会话管理 |
| `usage-tracker.ts` | Token 和 API 使用量追踪 |
| `summary-report.ts` | Team 执行摘要报告生成 |
| `mcp-team-bridge.ts` | MCP 协议 Team 桥接 |
| `bridge-entry.ts` | Team 桥接入口点 |
| `fs-utils.ts` | 文件系统工具函数 |
| `task-file-ops.ts` | 任务文件操作 |
| `types.ts` | Team 相关类型定义 |
| `index.ts` | 模块导出入口 |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `__tests__/` | Team 功能单元测试 |

## For AI Agents

### Team 生命周期
```
TeamCreate → TaskCreate × N → Task(team_name, name) × N → 队友完成任务 → SendMessage(shutdown_request) → TeamDelete
```

### 状态持久化
- Team 状态写入 `.omc/state/team-state.json`
- 使用 `state_write(mode="team")` 更新状态
- 跟踪字段：`current_phase`、`team_name`、`fix_loop_count`、`linked_ralph`

### 修改此目录时
- 修改 Team 协议后更新 `docs/ARCHITECTURE.md`
- 新增 Team 阶段需更新根目录 `AGENTS.md` 的 team_pipeline 部分
- 健康监控相关修改需同步更新 `src/hooks/team-pipeline/`

## Dependencies

### Internal
- `src/hooks/team-pipeline/` — Team 流水线 hook
- `src/features/state-manager/` — 状态管理
- `bridge/team-bridge.cjs` — 构建产物

### External
- `better-sqlite3` — 任务状态存储
- `@anthropic-ai/claude-agent-sdk` — Claude Code 集成

<!-- MANUAL: -->

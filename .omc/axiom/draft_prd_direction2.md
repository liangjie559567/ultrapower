---
title: "Agent 可观测性平台 Draft PRD"
direction: 2
status: draft
created: 2026-03-02
---

# Draft PRD：Agent 可观测性平台

## 1. 背景与目标

ultrapower 拥有 49 个 agents、71 个 skills、47 个 hooks，但目前缺乏统一的可观测性层。用户无法直观了解：
- 哪个 agent 执行了什么、耗时多少
- 哪些工具调用最频繁/最慢
- token 消耗与 API 成本估算

**目标**：构建完整的 Agent 可观测性平台，覆盖执行追踪、工具分析、成本追踪三个维度，数据存储于 SQLite，通过 `/ax-observe` skill 和 `/ax-status` 集成展示。

## 2. 用户故事

- 作为开发者，我想查看最近一次 ultrawork 执行中每个 agent 的耗时分布
- 作为开发者，我想知道哪个工具调用最慢，以便优化
- 作为开发者，我想估算本次会话的 token 消耗和成本
- 作为开发者，我想在 `/ax-status` 中看到系统健康概览

## 3. 功能范围

### 3.1 Agent 执行追踪
- 记录每次 agent 调用：agent_type、model、start_time、end_time、duration_ms、session_id
- 支持按 session / agent_type / 时间范围查询
- 存储于 SQLite：`observability.db` → `agent_runs` 表

### 3.2 工具调用分析
- 记录每次工具调用：tool_name、duration_ms、success、error_msg、session_id
- 聚合统计：调用次数、平均耗时、P95 耗时、失败率
- 存储于 SQLite：`tool_calls` 表

### 3.3 成本追踪
- 估算 token 消耗（input/output tokens per agent run）
- 按模型计算成本（haiku/sonnet/opus 单价）
- 存储于 SQLite：`cost_records` 表

### 3.4 展示层
- `/ax-observe` skill：独立查询命令，支持 `--session`、`--agent`、`--tool`、`--cost` 子命令
- `/ax-status` 集成：在现有仪表盘增加「可观测性摘要」区块

## 4. 技术方案

- **存储**：SQLite（`better-sqlite3`，已有依赖），路径 `.omc/observability.db`
- **核心模块**：`src/hooks/observability/`
  - `db.ts` — SQLite 初始化 + schema
  - `agent-tracker.ts` — agent run 记录
  - `tool-tracker.ts` — tool call 记录
  - `cost-estimator.ts` — token/cost 估算
  - `query-engine.ts` — 查询聚合接口
- **Skill**：`skills/ax-observe/SKILL.md`
- **ax-status 集成**：更新 `skills/ax-status/SKILL.md`

## 5. 验收标准

- [ ] SQLite schema 初始化，3 张表正确创建
- [ ] agent_runs 可写入、可按 session 查询
- [ ] tool_calls 可写入、可聚合统计（avg/p95/failure_rate）
- [ ] cost_records 可估算 haiku/sonnet/opus 成本
- [ ] `/ax-observe` skill 输出格式化报告
- [ ] `/ax-status` 显示可观测性摘要
- [ ] 单元测试覆盖核心模块（≥15 个测试用例）
- [ ] tsc --noEmit 0 errors，全量测试通过

## 6. 不在范围内

- 实时流式监控（WebSocket/SSE）
- 跨项目数据聚合
- 告警/通知系统

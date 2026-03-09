---
title: "Agent 可观测性平台 Rough PRD"
direction: 2
status: rough
created: 2026-03-02
review_verdict: "Pass with modifications (4/5 experts)"
---

# Rough PRD：Agent 可观测性平台

## 1. 背景与目标

ultrapower 拥有 49 个 agents、71 个 skills、47 个 hooks，缺乏统一可观测性层。

**目标**：构建 Agent 可观测性平台，覆盖执行追踪、工具分析、成本追踪三个维度。

## 2. 评审仲裁结论

### 采纳的修改（来自专家评审）

| 修改点 | 来源 | 原因 |
| -------- | ------ | ------ |
| 存储位置改为 `~/.claude/.omc/observability.db` | Critic | 解决 gitignore 问题 + 支持跨 worktree 聚合 |
| WAL 模式 + 内存队列异步写入 | Critic + Domain Expert | 防 SQLITE_BUSY，不阻塞主线程 |
| schema 增加 `parent_run_id` | Domain Expert | 重建执行链，可观测性基础字段 |
| token 四维存储（input/output/cache_write/cache_read） | Domain Expert | 对齐现有 cost-estimator.ts |
| `/ax-observe` 合并为 `/trace --observe` 扩展 | Product Director | 降低认知分裂，复用现有入口 |
| P95 用应用层计算（最近 1000 条 + 索引） | Domain Expert | SQLite 无原生百分位函数 |
| 优先走 tokscale-adapter.ts 动态定价 | Domain Expert | 硬编码仅作 fallback |

### 不采纳的建议

| 建议 | 来源 | 原因 |
| ------ | ------ | ------ |
| 改用 JSONL 轻量路径 | Product Director | 用户已明确选择 SQLite |
| 延迟到 Q2 实现 | Product Director | 用户已确认方向 |

## 3. 功能范围（修订版）

### 3.1 Agent 执行追踪

* 记录每次 agent 调用：`agent_type`、`model`、`start_time`、`end_time`、`duration_ms`、`session_id`、`parent_run_id`

* 支持按 session / agent_type / 时间范围查询

### 3.2 工具调用分析

* 记录每次工具调用：`tool_name`、`duration_ms`、`success`、`error_msg`、`session_id`、`parent_run_id`

* 聚合统计：调用次数、平均耗时、P95 耗时（应用层，最近 1000 条）、失败率

### 3.3 成本追踪

* 四维 token 存储：`input_tokens`、`output_tokens`、`cache_write_tokens`、`cache_read_tokens`

* 优先走 `tokscale-adapter.ts` 动态定价，硬编码作 fallback

* 按模型计算成本（haiku/sonnet/opus）

### 3.4 展示层

* `/trace --observe [--session <id>] [--agent <type>] [--tool <name>] [--cost] [--last <n>]`：扩展现有 `/trace` skill

* `/ax-status` 集成：增加「可观测性摘要」区块

## 4. 技术方案（修订版）

### 存储

* 路径：`~/.claude/.omc/observability.db`（全局，跨 worktree）

* WAL 模式：`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;`

* 写入：内存队列 + `setImmediate` 异步 flush，批量写入

### Schema

```sql
CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  parent_run_id TEXT,
  agent_type TEXT NOT NULL,
  model TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  duration_ms INTEGER,
  status TEXT DEFAULT 'running'
);

CREATE TABLE tool_calls (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  parent_run_id TEXT,
  tool_name TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  duration_ms INTEGER,
  success INTEGER NOT NULL DEFAULT 1,
  error_msg TEXT
);

CREATE TABLE cost_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  agent_run_id TEXT,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  recorded_at INTEGER NOT NULL
);

CREATE INDEX idx_agent_runs_session ON agent_runs(session_id);
CREATE INDEX idx_tool_calls_session ON tool_calls(session_id);
CREATE INDEX idx_tool_calls_duration ON tool_calls(duration_ms);
CREATE INDEX idx_cost_records_session ON cost_records(session_id);
```

### 核心模块

* `src/hooks/observability/db.ts` — SQLite 初始化 + WAL + schema

* `src/hooks/observability/write-queue.ts` — 内存队列 + 异步 flush

* `src/hooks/observability/agent-tracker.ts` — agent run 记录

* `src/hooks/observability/tool-tracker.ts` — tool call 记录

* `src/hooks/observability/cost-estimator.ts` — token/cost 估算（对齐现有实现）

* `src/hooks/observability/query-engine.ts` — 查询聚合（含 P95 应用层计算）

* `skills/trace/SKILL.md` — 扩展 `--observe` 子命令

* `skills/ax-status/SKILL.md` — 增加可观测性摘要区块

## 5. 验收标准

* [ ] `~/.claude/.omc/observability.db` 自动创建，WAL 模式，3 张表正确建立

* [ ] agent_runs 可写入（异步队列）、可按 session 查询

* [ ] tool_calls 可写入、P95 应用层计算正确（最近 1000 条）

* [ ] cost_records 四维 token 存储，动态定价优先

* [ ] `/trace --observe` 输出格式化报告（含 `--last <n>` 快捷参数）

* [ ] `/ax-status` 显示可观测性摘要

* [ ] 单元测试 ≥ 15 个测试用例

* [ ] tsc --noEmit 0 errors，全量测试通过

## 6. 不在范围内

* 实时流式监控（WebSocket/SSE）

* 跨项目数据聚合

* 告警/通知系统

* 独立 `/ax-observe` skill（合并到 `/trace`）

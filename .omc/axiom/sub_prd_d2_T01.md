---
task: T-01
title: SQLite DB 初始化
depends: []
---

# T-01: SQLite DB 初始化

## 目标

创建 `src/hooks/observability/db.ts`，初始化全局 SQLite 数据库。

## 实现要点

* 数据库路径：`path.join(os.homedir(), '.claude', '.omc', 'observability.db')`

* 使用 `better-sqlite3`（已有依赖）

* 启用 WAL 模式：`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;`

* 创建 3 张表（见 schema）+ 4 个索引

* 导出单例 `getDb(): Database`，懒初始化

## Schema

```sql
CREATE TABLE IF NOT EXISTS agent_runs (
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
CREATE TABLE IF NOT EXISTS tool_calls (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  parent_run_id TEXT,
  tool_name TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  duration_ms INTEGER,
  success INTEGER NOT NULL DEFAULT 1,
  error_msg TEXT
);
CREATE TABLE IF NOT EXISTS cost_records (
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
CREATE INDEX IF NOT EXISTS idx_agent_runs_session ON agent_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON tool_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_duration ON tool_calls(duration_ms);
CREATE INDEX IF NOT EXISTS idx_cost_records_session ON cost_records(session_id);
```

## 接口

```typescript
export function getDb(): Database; // better-sqlite3 Database
export function closeDb(): void;
```

## 验收

* `getDb()` 返回已初始化的 DB 实例

* 3 张表 + 4 个索引存在

* WAL 模式已启用

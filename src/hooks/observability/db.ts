import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';

let _db: InstanceType<typeof Database> | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
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
`;

export function getDb(dbPath?: string): InstanceType<typeof Database> {
  if (!_db) {
    const p = dbPath ?? path.join(os.homedir(), '.claude', '.omc', 'observability.db');
    _db = new Database(p);
    _db.exec(SCHEMA);
  }
  return _db;
}

export function closeDb(): void {
  _db?.close();
  _db = null;
}

export function resetDb(): void {
  closeDb();
}

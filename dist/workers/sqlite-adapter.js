/**
 * SQLite Worker State Adapter
 */
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
export class SqliteWorkerAdapter {
    db = null;
    cwd;
    constructor(cwd) {
        this.cwd = cwd;
    }
    async init() {
        try {
            const betterSqlite3Module = await import('better-sqlite3');
            const DatabaseConstructor = betterSqlite3Module.default || betterSqlite3Module;
            const stateDir = join(this.cwd, '.omc', 'state');
            if (!existsSync(stateDir)) {
                mkdirSync(stateDir, { recursive: true });
            }
            const dbPath = join(stateDir, 'workers.db');
            this.db = new DatabaseConstructor(dbPath);
            if (this.db) {
                this.db.pragma('journal_mode = WAL');
                this.db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
          worker_id TEXT PRIMARY KEY,
          worker_type TEXT NOT NULL,
          name TEXT NOT NULL,
          status TEXT NOT NULL,
          pid INTEGER,
          spawned_at TEXT NOT NULL,
          last_heartbeat_at TEXT,
          completed_at TEXT,
          provider TEXT,
          model TEXT,
          agent_role TEXT,
          prompt_file TEXT,
          response_file TEXT,
          team_name TEXT,
          tmux_session TEXT,
          current_task_id TEXT,
          consecutive_errors INTEGER DEFAULT 0,
          error TEXT,
          metadata TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_worker_type ON workers(worker_type);
        CREATE INDEX IF NOT EXISTS idx_status ON workers(status);
        CREATE INDEX IF NOT EXISTS idx_team_name ON workers(team_name);
      `);
            }
            return true;
        }
        catch (error) {
            console.error('[SqliteWorkerAdapter] Init failed:', error);
            return false;
        }
    }
    async upsert(worker) {
        if (!this.db)
            return false;
        try {
            const stmt = this.db.prepare(`
        INSERT INTO workers (
          worker_id, worker_type, name, status, pid,
          spawned_at, last_heartbeat_at, completed_at,
          provider, model, agent_role, prompt_file, response_file,
          team_name, tmux_session, current_task_id, consecutive_errors,
          error, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(worker_id) DO UPDATE SET
          status = excluded.status,
          last_heartbeat_at = excluded.last_heartbeat_at,
          completed_at = excluded.completed_at,
          current_task_id = excluded.current_task_id,
          consecutive_errors = excluded.consecutive_errors,
          error = excluded.error,
          metadata = excluded.metadata
      `);
            stmt.run(worker.workerId, worker.workerType, worker.name, worker.status, worker.pid ?? null, worker.spawnedAt, worker.lastHeartbeatAt ?? null, worker.completedAt ?? null, worker.provider ?? null, worker.model ?? null, worker.agentRole ?? null, worker.promptFile ?? null, worker.responseFile ?? null, worker.teamName ?? null, worker.tmuxSession ?? null, worker.currentTaskId ?? null, worker.consecutiveErrors ?? 0, worker.error ?? null, worker.metadata ? JSON.stringify(worker.metadata) : null);
            return true;
        }
        catch (error) {
            console.error('[SqliteWorkerAdapter] Upsert failed:', error);
            return false;
        }
    }
    async get(workerId) {
        if (!this.db)
            return null;
        try {
            const stmt = this.db.prepare('SELECT * FROM workers WHERE worker_id = ?');
            const row = stmt.get(workerId);
            return row ? this.rowToWorkerState(row) : null;
        }
        catch (error) {
            console.error('[SqliteWorkerAdapter] Get failed:', error);
            return null;
        }
    }
    async list(filter) {
        if (!this.db)
            return [];
        try {
            let query = 'SELECT * FROM workers WHERE 1=1';
            const params = [];
            if (filter?.workerType) {
                query += ' AND worker_type = ?';
                params.push(filter.workerType);
            }
            if (filter?.status) {
                const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
                query += ` AND status IN (${statuses.map(() => '?').join(',')})`;
                params.push(...statuses);
            }
            if (filter?.teamName) {
                query += ' AND team_name = ?';
                params.push(filter.teamName);
            }
            if (filter?.provider) {
                query += ' AND provider = ?';
                params.push(filter.provider);
            }
            if (filter?.spawnedAfter) {
                query += ' AND spawned_at >= ?';
                params.push(filter.spawnedAfter.toISOString());
            }
            if (filter?.spawnedBefore) {
                query += ' AND spawned_at <= ?';
                params.push(filter.spawnedBefore.toISOString());
            }
            query += ' ORDER BY spawned_at DESC';
            const stmt = this.db.prepare(query);
            const rows = stmt.all(...params);
            return rows.map(row => this.rowToWorkerState(row));
        }
        catch (error) {
            console.error('[SqliteWorkerAdapter] List failed:', error);
            return [];
        }
    }
    async delete(workerId) {
        if (!this.db)
            return false;
        try {
            const stmt = this.db.prepare('DELETE FROM workers WHERE worker_id = ?');
            const result = stmt.run(workerId);
            return result.changes > 0;
        }
        catch (error) {
            console.error('[SqliteWorkerAdapter] Delete failed:', error);
            return false;
        }
    }
    async healthCheck(workerId, maxHeartbeatAge = 30000) {
        const worker = await this.get(workerId);
        if (!worker)
            return { isAlive: false };
        const now = Date.now();
        let heartbeatAge;
        if (worker.lastHeartbeatAt) {
            heartbeatAge = now - new Date(worker.lastHeartbeatAt).getTime();
        }
        const isAlive = worker.status === 'running' || worker.status === 'working'
            ? (heartbeatAge !== undefined && heartbeatAge < maxHeartbeatAge)
            : worker.status !== 'dead';
        const uptimeMs = now - new Date(worker.spawnedAt).getTime();
        return { isAlive, heartbeatAge, lastError: worker.error, uptimeMs };
    }
    async batchUpsert(workers) {
        if (!this.db)
            return 0;
        try {
            const transaction = this.db.transaction((workers) => {
                let count = 0;
                for (const worker of workers) {
                    if (this.upsertSync(worker))
                        count++;
                }
                return count;
            });
            return transaction(workers);
        }
        catch (error) {
            console.error('[SqliteWorkerAdapter] Batch upsert failed:', error);
            return 0;
        }
    }
    async cleanup(maxAgeMs) {
        if (!this.db)
            return 0;
        try {
            const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
            const stmt = this.db.prepare(`
        DELETE FROM workers
        WHERE status IN ('completed', 'failed', 'timeout', 'dead')
        AND (completed_at < ? OR (completed_at IS NULL AND spawned_at < ?))
      `);
            const result = stmt.run(cutoff, cutoff);
            return result.changes;
        }
        catch (error) {
            console.error('[SqliteWorkerAdapter] Cleanup failed:', error);
            return 0;
        }
    }
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    rowToWorkerState(row) {
        return {
            workerId: row.worker_id,
            workerType: row.worker_type,
            name: row.name,
            status: row.status,
            pid: row.pid,
            spawnedAt: row.spawned_at,
            lastHeartbeatAt: row.last_heartbeat_at,
            completedAt: row.completed_at,
            provider: row.provider,
            model: row.model,
            agentRole: row.agent_role,
            promptFile: row.prompt_file,
            responseFile: row.response_file,
            teamName: row.team_name,
            tmuxSession: row.tmux_session,
            currentTaskId: row.current_task_id,
            consecutiveErrors: row.consecutive_errors,
            error: row.error,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        };
    }
    upsertSync(worker) {
        if (!this.db)
            return false;
        try {
            const stmt = this.db.prepare(`
        INSERT INTO workers (
          worker_id, worker_type, name, status, pid,
          spawned_at, last_heartbeat_at, completed_at,
          provider, model, agent_role, prompt_file, response_file,
          team_name, tmux_session, current_task_id, consecutive_errors,
          error, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(worker_id) DO UPDATE SET
          status = excluded.status,
          last_heartbeat_at = excluded.last_heartbeat_at,
          completed_at = excluded.completed_at,
          current_task_id = excluded.current_task_id,
          consecutive_errors = excluded.consecutive_errors,
          error = excluded.error,
          metadata = excluded.metadata
      `);
            stmt.run(worker.workerId, worker.workerType, worker.name, worker.status, worker.pid ?? null, worker.spawnedAt, worker.lastHeartbeatAt ?? null, worker.completedAt ?? null, worker.provider ?? null, worker.model ?? null, worker.agentRole ?? null, worker.promptFile ?? null, worker.responseFile ?? null, worker.teamName ?? null, worker.tmuxSession ?? null, worker.currentTaskId ?? null, worker.consecutiveErrors ?? 0, worker.error ?? null, worker.metadata ? JSON.stringify(worker.metadata) : null);
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=sqlite-adapter.js.map
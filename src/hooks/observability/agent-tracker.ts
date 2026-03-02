import { randomUUID } from 'crypto';
import { getDb } from './db.js';
import { WriteQueue } from './write-queue.js';

export interface AgentRunRecord {
  id: string;
  session_id: string;
  parent_run_id?: string;
  agent_type: string;
  model: string;
  start_time: number;
  end_time?: number;
  duration_ms?: number;
  status: 'running' | 'completed' | 'failed';
}

export class AgentTracker {
  private _queue = new WriteQueue();

  startRun(opts: Omit<AgentRunRecord, 'id' | 'start_time' | 'status'>): string {
    const id = randomUUID();
    const start_time = Date.now();
    this._queue.enqueue({
      table: 'agent_runs',
      row: { id, session_id: opts.session_id, parent_run_id: opts.parent_run_id ?? null, agent_type: opts.agent_type, model: opts.model, start_time, status: 'running' },
    });
    this._queue.flush();
    return id;
  }

  endRun(id: string, status: 'completed' | 'failed' = 'completed'): void {
    const end_time = Date.now();
    const db = getDb();
    const row = db.prepare('SELECT start_time FROM agent_runs WHERE id = ?').get(id) as { start_time: number } | undefined;
    const duration_ms = row ? end_time - row.start_time : null;
    db.prepare('UPDATE agent_runs SET end_time = ?, duration_ms = ?, status = ? WHERE id = ?')
      .run(end_time, duration_ms, status, id);
  }
}

export const agentTracker = new AgentTracker();

import { randomUUID } from 'crypto';
import { getDb } from './db.js';
import { WriteQueue } from './write-queue.js';

export class ToolTracker {
  private _queue = new WriteQueue();

  startCall(opts: { session_id: string; tool_name: string; parent_run_id?: string }): string {
    const id = randomUUID();
    this._queue.enqueue({
      table: 'tool_calls',
      row: { id, session_id: opts.session_id, parent_run_id: opts.parent_run_id ?? null, tool_name: opts.tool_name, start_time: Date.now(), success: 1 },
    });
    this._queue.flush();
    return id;
  }

  endCall(id: string, success: boolean, error_msg?: string): void {
    const db = getDb();
    const row = db.prepare('SELECT start_time FROM tool_calls WHERE id = ?').get(id) as { start_time: number } | undefined;
    const duration_ms = row ? Date.now() - row.start_time : null;
    db.prepare('UPDATE tool_calls SET duration_ms = ?, success = ?, error_msg = ? WHERE id = ?')
      .run(duration_ms, success ? 1 : 0, error_msg ?? null, id);
  }
}

export const toolTracker = new ToolTracker();

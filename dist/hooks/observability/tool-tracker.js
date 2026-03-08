import { randomUUID } from 'crypto';
import { getDb } from './db.js';
import { WriteQueue } from './write-queue.js';
export class ToolTracker {
    _queue = new WriteQueue();
    startCall(opts) {
        const id = randomUUID();
        this._queue.enqueue({
            table: 'tool_calls',
            row: { id, session_id: opts.session_id, parent_run_id: opts.parent_run_id ?? null, tool_name: opts.tool_name, start_time: Date.now(), success: 1 },
        });
        this._queue.flush();
        return id;
    }
    endCall(id, success, error_msg) {
        const db = getDb();
        const row = db.prepare('SELECT start_time FROM tool_calls WHERE id = ?').get(id);
        const duration_ms = row ? Date.now() - row.start_time : null;
        db.prepare('UPDATE tool_calls SET duration_ms = ?, success = ?, error_msg = ? WHERE id = ?')
            .run(duration_ms, success ? 1 : 0, error_msg ?? null, id);
    }
}
export const toolTracker = new ToolTracker();
//# sourceMappingURL=tool-tracker.js.map
import { getDb } from './db.js';

export interface WriteOp {
  table: string;
  row: Record<string, unknown>;
}

export class WriteQueue {
  private _queue: WriteOp[] = [];
  private _scheduled = false;

  enqueue(op: WriteOp): void {
    this._queue.push(op);
    if (!this._scheduled) {
      this._scheduled = true;
      setImmediate(() => this._flush());
    }
  }

  private _flush(): void {
    this._scheduled = false;
    if (this._queue.length === 0) return;
    const ops = this._queue.splice(0);
    const db = getDb();
    const byTable = new Map<string, WriteOp[]>();
    for (const op of ops) {
      const list = byTable.get(op.table) ?? [];
      list.push(op);
      byTable.set(op.table, list);
    }
    db.transaction(() => {
      for (const [table, tableOps] of byTable) {
        const cols = Object.keys(tableOps[0]!.row);
        const stmt = db.prepare(
          `INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
        );
        for (const op of tableOps) {
          stmt.run(...cols.map(c => op.row[c] ?? null));
        }
      }
    })();
  }

  flush(): void {
    this._flush();
  }

  get pending(): number {
    return this._queue.length;
  }
}

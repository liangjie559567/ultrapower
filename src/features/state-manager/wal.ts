import * as fs from 'fs';
import * as path from 'path';

interface WALEntry<T = unknown> {
  id: string;
  timestamp: number;
  mode: string;
  data: T;
  committed: boolean;
}

export class WriteAheadLog {
  private walDir: string;
  private entries: Map<string, WALEntry<unknown>> = new Map();

  constructor(baseDir: string) {
    this.walDir = path.join(baseDir, '.omc', 'state', 'wal');
    this.ensureWalDir();
    this.loadWAL();
  }

  private ensureWalDir(): void {
    if (!fs.existsSync(this.walDir)) {
      fs.mkdirSync(this.walDir, { recursive: true });
    }
  }

  private loadWAL(): void {
    if (!fs.existsSync(this.walDir)) return;

    const files = fs.readdirSync(this.walDir);
    for (const file of files) {
      if (!file.endsWith('.wal')) continue;

      const filePath = path.join(this.walDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const entry: WALEntry<unknown> = JSON.parse(content);
        this.entries.set(entry.id, entry);
      } catch {
        // Skip corrupted WAL files
      }
    }
  }

  writeEntry<T = unknown>(mode: string, data: T): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const entry: WALEntry<T> = {
      id,
      timestamp: Date.now(),
      mode,
      data,
      committed: false
    };

    const walPath = path.join(this.walDir, `${id}.wal`);
    fs.writeFileSync(walPath, JSON.stringify(entry, null, 2));
    this.entries.set(id, entry);

    return id;
  }

  commit(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;

    entry.committed = true;
    const walPath = path.join(this.walDir, `${id}.wal`);
    fs.writeFileSync(walPath, JSON.stringify(entry, null, 2));
  }

  cleanup(): void {
    for (const [id, entry] of this.entries) {
      if (entry.committed) {
        const walPath = path.join(this.walDir, `${id}.wal`);
        if (fs.existsSync(walPath)) {
          fs.unlinkSync(walPath);
        }
        this.entries.delete(id);
      }
    }
  }

  getUncommitted(): WALEntry<unknown>[] {
    return Array.from(this.entries.values()).filter(e => !e.committed);
  }

  recover(): WALEntry<unknown>[] {
    const uncommitted = this.getUncommitted();
    return uncommitted;
  }
}

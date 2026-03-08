import * as fs from 'fs';
import * as path from 'path';
export class WriteAheadLog {
    walDir;
    entries = new Map();
    constructor(baseDir) {
        this.walDir = path.join(baseDir, '.omc', 'state', 'wal');
        this.ensureWalDir();
        this.loadWAL();
    }
    ensureWalDir() {
        if (!fs.existsSync(this.walDir)) {
            fs.mkdirSync(this.walDir, { recursive: true });
        }
    }
    loadWAL() {
        if (!fs.existsSync(this.walDir))
            return;
        const files = fs.readdirSync(this.walDir);
        for (const file of files) {
            if (!file.endsWith('.wal'))
                continue;
            const filePath = path.join(this.walDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const entry = JSON.parse(content);
                this.entries.set(entry.id, entry);
            }
            catch {
                // Skip corrupted WAL files
            }
        }
    }
    writeEntry(mode, data) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const entry = {
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
    commit(id) {
        const entry = this.entries.get(id);
        if (!entry)
            return;
        entry.committed = true;
        const walPath = path.join(this.walDir, `${id}.wal`);
        fs.writeFileSync(walPath, JSON.stringify(entry, null, 2));
    }
    cleanup() {
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
    getUncommitted() {
        return Array.from(this.entries.values()).filter(e => !e.committed);
    }
    recover() {
        const uncommitted = this.getUncommitted();
        return uncommitted;
    }
}
//# sourceMappingURL=wal.js.map
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
export class MetricsStorage {
    static getPath(cwd) {
        const dir = join(cwd, '.omc', 'metrics');
        if (!existsSync(dir))
            mkdirSync(dir, { recursive: true });
        return join(dir, 'usage.json');
    }
    static save(data, cwd) {
        writeFileSync(this.getPath(cwd), JSON.stringify(data, null, 2));
    }
    static load(cwd) {
        const path = this.getPath(cwd);
        if (!existsSync(path))
            return { sessions: [], skills: [], agents: [] };
        return JSON.parse(readFileSync(path, 'utf-8'));
    }
}
//# sourceMappingURL=storage.js.map
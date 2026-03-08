import * as fs from 'fs/promises';
class DocCache {
    cache = new Map();
    TTL = 300000; // 5 minutes
    async get(path) {
        const entry = this.cache.get(path);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(path);
            return null;
        }
        return entry.content;
    }
    set(path, content) {
        this.cache.set(path, { content, timestamp: Date.now() });
    }
    clear() {
        this.cache.clear();
    }
    async readWithCache(path) {
        const cached = await this.get(path);
        if (cached !== null)
            return cached;
        const content = await fs.readFile(path, 'utf-8');
        this.set(path, content);
        return content;
    }
}
export const docCache = new DocCache();
//# sourceMappingURL=doc-cache.js.map
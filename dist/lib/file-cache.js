/**
 * Simple in-memory file cache with TTL
 * Reduces redundant file I/O operations
 */
import { CACHE } from './constants.js';
class FileCache {
    cache = new Map();
    ttl;
    constructor(ttlMs = CACHE.FILE_TTL) {
        this.ttl = ttlMs;
    }
    get(path) {
        const entry = this.cache.get(path);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(path);
            return null;
        }
        return entry.data;
    }
    set(path, data) {
        this.cache.set(path, { data, timestamp: Date.now() });
    }
    clear() {
        this.cache.clear();
    }
    delete(path) {
        this.cache.delete(path);
    }
}
export const fileCache = new FileCache();
//# sourceMappingURL=file-cache.js.map
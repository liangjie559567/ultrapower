import { watch } from "fs";
import { readFile } from "fs/promises";
class LRUCache {
    cache = new Map();
    maxSize;
    constructor(maxSize) {
        this.maxSize = maxSize;
    }
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }
    set(key, value) {
        this.cache.delete(key);
        this.cache.set(key, value);
        if (this.cache.size > this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
    }
    delete(key) {
        this.cache.delete(key);
    }
}
const fileCache = new LRUCache(50);
const watchers = new Map();
function watchFile(path) {
    if (watchers.has(path))
        return;
    try {
        const watcher = watch(path, () => {
            fileCache.delete(path);
        });
        watcher.on('error', (err) => {
            watchers.delete(path);
            import("../audit/logger.js").then(({ auditLogger }) => {
                auditLogger.log({
                    actor: "bridge",
                    action: "file-watch-error",
                    resource: path,
                    result: "failure",
                    metadata: { error: err.message }
                }).catch(() => { });
            });
        });
        watchers.set(path, watcher);
    }
    catch (err) {
        import("../audit/logger.js").then(({ auditLogger }) => {
            auditLogger.log({
                actor: "bridge",
                action: "file-watch-setup-error",
                resource: path,
                result: "failure",
                metadata: { error: err instanceof Error ? err.message : String(err) }
            }).catch(() => { });
        });
    }
}
export async function readFileCached(path) {
    const cached = fileCache.get(path);
    if (cached !== undefined)
        return cached;
    const content = await readFile(path, "utf-8");
    const recheck = fileCache.get(path);
    if (recheck !== undefined)
        return recheck;
    fileCache.set(path, content);
    watchFile(path);
    return content;
}
//# sourceMappingURL=cache.js.map
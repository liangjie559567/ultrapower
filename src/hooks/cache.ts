import { watch } from "fs";
import { readFile } from "fs/promises";

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value as K;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  delete(key: K): void {
    this.cache.delete(key);
  }
}

const fileCache = new LRUCache<string, string>(50);
const watchers = new Map<string, ReturnType<typeof watch>>();

function watchFile(path: string): void {
  if (watchers.has(path)) return;
  try {
    const watcher = watch(path, () => {
      fileCache.delete(path);
    });
    watcher.on('error', (err: Error) => {
      watchers.delete(path);
      import("../audit/logger.js").then(({ auditLogger }) => {
        auditLogger.log({
          actor: "bridge",
          action: "file-watch-error",
          resource: path,
          result: "failure",
          metadata: { error: err.message }
        }).catch(() => {});
      });
    });
    watchers.set(path, watcher);
  } catch (err: unknown) {
    import("../audit/logger.js").then(({ auditLogger }) => {
      auditLogger.log({
        actor: "bridge",
        action: "file-watch-setup-error",
        resource: path,
        result: "failure",
        metadata: { error: err instanceof Error ? err.message : String(err) }
      }).catch(() => {});
    });
  }
}

export async function readFileCached(path: string): Promise<string> {
  const cached = fileCache.get(path);
  if (cached !== undefined) return cached;

  const content = await readFile(path, "utf-8");
  const recheck = fileCache.get(path);
  if (recheck !== undefined) return recheck;

  fileCache.set(path, content);
  watchFile(path);
  return content;
}

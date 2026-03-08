import * as fs from 'fs/promises';

interface CacheEntry {
  content: string;
  timestamp: number;
}

class DocCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 300000; // 5 minutes

  async get(path: string): Promise<string | null> {
    const entry = this.cache.get(path);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(path);
      return null;
    }

    return entry.content;
  }

  set(path: string, content: string): void {
    this.cache.set(path, { content, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  async readWithCache(path: string): Promise<string> {
    const cached = await this.get(path);
    if (cached !== null) return cached;

    const content = await fs.readFile(path, 'utf-8');
    this.set(path, content);
    return content;
  }
}

export const docCache = new DocCache();

import { promises as fs } from 'fs';

interface DirCacheEntry {
  entries: string[];
  timestamp: number;
}

class FileCache {
  private dirCache = new Map<string, DirCacheEntry>();
  private readonly TTL = 300000; // 5 minutes
  private readonly MAX_SIZE = 100;
  private hits = 0;
  private misses = 0;

  async readdir(dirPath: string, useCache = true): Promise<string[]> {
    if (!useCache) {
      return fs.readdir(dirPath);
    }

    const cached = this.dirCache.get(dirPath);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      this.hits++;
      return cached.entries;
    }

    this.misses++;
    const entries = await fs.readdir(dirPath);

    if (this.dirCache.size >= this.MAX_SIZE) {
      const oldest = Array.from(this.dirCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      this.dirCache.delete(oldest[0]);
    }

    this.dirCache.set(dirPath, { entries, timestamp: Date.now() });
    return entries;
  }

  clear(): void {
    this.dirCache.clear();
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.dirCache.size,
      maxSize: this.MAX_SIZE,
      ttl: this.TTL,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

export const fileCache = new FileCache();

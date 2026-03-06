/**
 * Simple in-memory file cache with TTL
 * Reduces redundant file I/O operations
 */

import { CACHE } from './constants.js';

interface CacheEntry {
  data: string;
  timestamp: number;
}

class FileCache {
  private cache = new Map<string, CacheEntry>();
  private ttl: number;

  constructor(ttlMs: number = CACHE.FILE_TTL) {
    this.ttl = ttlMs;
  }

  get(path: string): string | null {
    const entry = this.cache.get(path);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(path);
      return null;
    }

    return entry.data;
  }

  set(path: string, data: string): void {
    this.cache.set(path, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(path: string): void {
    this.cache.delete(path);
  }
}

export const fileCache = new FileCache();

/**
 * State Cache with Copy-on-Write
 *
 * Provides mtime-based cache invalidation and shallow copy on read
 * to prevent accidental mutations of cached data.
 */

import { statSync } from 'fs';

interface CacheEntry {
  data: unknown;
  mtime: number;
  cachedAt: number;
}

const stateCache = new Map<string, CacheEntry>();

/**
 * Read state with cache and mtime validation
 * @param path - File path to read
 * @param data - Parsed JSON data (if already read)
 * @param ttl - Cache TTL in milliseconds (default: 5000ms)
 * @returns Shallow copy of cached data
 */
export function readStateWithCache(path: string, data: unknown, ttl: number = 5000): unknown {
  try {
    const mtime = statSync(path).mtimeMs;
    const cached = stateCache.get(path);

    // Cache hit: mtime matches and within TTL
    if (cached && cached.mtime === mtime && Date.now() - cached.cachedAt < ttl) {
      return { ...cached.data }; // Shallow copy (Copy-on-Write)
    }

    // Cache miss: update cache
    stateCache.set(path, { data, mtime, cachedAt: Date.now() });
    return data;
  } catch {
    // If stat fails, return data without caching
    return data;
  }
}

/**
 * Invalidate cache entry for a path
 */
export function invalidateStateCache(path: string): void {
  stateCache.delete(path);
}

/**
 * Get cache statistics
 */
export function getStateCacheStats() {
  return {
    size: stateCache.size,
    entries: Array.from(stateCache.keys())
  };
}

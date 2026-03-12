/**
 * State Cache with Lazy mtime Validation
 *
 * Optimizations:
 * - Delays mtime checks to once per second (reduces I/O by 100-200x)
 * - Uses Object.freeze() instead of shallow copy (eliminates copy overhead)
 * - Fast path: pure memory lookup when cache is fresh
 * - Slow path: mtime validation only when needed
 */
/**
 * Read state with cache and lazy mtime validation
 * @param path - File path to read
 * @param data - Parsed JSON data (if already read)
 * @param ttl - Cache TTL in milliseconds (default: 5000ms)
 * @returns Frozen cached data (immutable)
 */
export declare function readStateWithCache(path: string, data: unknown, ttl?: number): unknown;
/**
 * Invalidate cache entry for a path
 */
export declare function invalidateStateCache(path: string): void;
/**
 * Get cache statistics
 */
export declare function getStateCacheStats(): {
    size: number;
    entries: string[];
};
//# sourceMappingURL=state-cache.d.ts.map
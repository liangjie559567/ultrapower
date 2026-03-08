/**
 * State Cache with Copy-on-Write
 *
 * Provides mtime-based cache invalidation and shallow copy on read
 * to prevent accidental mutations of cached data.
 */
/**
 * Read state with cache and mtime validation
 * @param path - File path to read
 * @param data - Parsed JSON data (if already read)
 * @param ttl - Cache TTL in milliseconds (default: 5000ms)
 * @returns Shallow copy of cached data
 */
export declare function readStateWithCache(path: string, data: any, ttl?: number): any;
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
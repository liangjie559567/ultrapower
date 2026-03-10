interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
}
export declare class ResultCache<T> {
    private maxSize;
    private ttlMs;
    private cache;
    private accessOrder;
    private hits;
    private misses;
    constructor(maxSize?: number, ttlMs?: number);
    set(key: string, value: T, userId: string): void;
    get(key: string, userId: string): T | null;
    getStats(): CacheStats;
    clear(): void;
}
export {};
//# sourceMappingURL=result-cache.d.ts.map
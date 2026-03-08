/**
 * Simple in-memory file cache with TTL
 * Reduces redundant file I/O operations
 */
declare class FileCache {
    private cache;
    private ttl;
    constructor(ttlMs?: number);
    get(path: string): string | null;
    set(path: string, data: string): void;
    clear(): void;
    delete(path: string): void;
}
export declare const fileCache: FileCache;
export {};
//# sourceMappingURL=file-cache.d.ts.map
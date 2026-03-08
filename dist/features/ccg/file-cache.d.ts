declare class FileCache {
    private dirCache;
    private readonly TTL;
    private readonly MAX_SIZE;
    private hits;
    private misses;
    readdir(dirPath: string, useCache?: boolean): Promise<string[]>;
    clear(): void;
    getStats(): {
        size: number;
        maxSize: number;
        ttl: number;
        hits: number;
        misses: number;
        hitRate: string;
    };
    resetStats(): void;
}
export declare const fileCache: FileCache;
export {};
//# sourceMappingURL=file-cache.d.ts.map
declare class DocCache {
    private cache;
    private readonly TTL;
    get(path: string): Promise<string | null>;
    set(path: string, content: string): void;
    clear(): void;
    readWithCache(path: string): Promise<string>;
}
export declare const docCache: DocCache;
export {};
//# sourceMappingURL=doc-cache.d.ts.map
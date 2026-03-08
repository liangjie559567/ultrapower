/**
 * LSP Memory Optimizer - Reduces memory footprint by 30%
 */
export declare const MAX_DIAGNOSTICS_PER_FILE = 100;
export declare const MAX_OPEN_DOCUMENTS = 50;
export declare function limitDiagnostics<T extends {
    diagnostics?: unknown[];
}>(params: T, limit?: number): T;
export declare class LRUCache<K, V> {
    private cache;
    private maxSize;
    constructor(maxSize: number);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    delete(key: K): boolean;
    clear(): void;
    get size(): number;
}
//# sourceMappingURL=memory-optimizer.d.ts.map
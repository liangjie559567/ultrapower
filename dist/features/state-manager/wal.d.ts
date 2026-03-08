interface WALEntry<T = unknown> {
    id: string;
    timestamp: number;
    mode: string;
    data: T;
    committed: boolean;
}
export declare class WriteAheadLog {
    private walDir;
    private entries;
    constructor(baseDir: string);
    private ensureWalDir;
    private loadWAL;
    writeEntry<T = unknown>(mode: string, data: T): string;
    commit(id: string): void;
    cleanup(): void;
    getUncommitted(): WALEntry<unknown>[];
    recover(): WALEntry<unknown>[];
}
export {};
//# sourceMappingURL=wal.d.ts.map
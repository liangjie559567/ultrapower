export interface WriteOp {
    table: string;
    row: Record<string, unknown>;
}
export declare class WriteQueue {
    private _queue;
    private _scheduled;
    enqueue(op: WriteOp): void;
    private _flush;
    flush(): void;
    get pending(): number;
}
//# sourceMappingURL=write-queue.d.ts.map
/**
 * Tiered State Writer
 * 关键状态立即写入，非关键状态批量写入
 */
export interface TieredWriterOptions {
    batchInterval?: number;
    batchSize?: number;
}
export interface WriteRequest {
    mode: string;
    data: unknown;
    timestamp: number;
}
export declare class TieredWriter {
    private batchInterval;
    private batchSize;
    private pendingWrites;
    private timer;
    private writeCount;
    private batchCount;
    constructor(options?: TieredWriterOptions);
    /**
     * 写入状态
     */
    write(mode: string, data: unknown, writeFn: (mode: string, data: unknown) => Promise<void>): Promise<void>;
    /**
     * 刷新批量写入
     */
    flush(writeFn: (mode: string, data: unknown) => Promise<void>): Promise<void>;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalWrites: number;
        batchWrites: number;
        pendingWrites: number;
        ioReduction: string;
    };
    /**
     * 清理
     */
    destroy(): void;
}
//# sourceMappingURL=tiered-writer.d.ts.map
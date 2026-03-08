/**
 * Cached Worker Adapter - LRU cache wrapper with 5s TTL
 */
import type { WorkerStateAdapter } from './adapter.js';
import type { WorkerState, WorkerFilter, HealthStatus } from './types.js';
export declare class CachedWorkerAdapter implements WorkerStateAdapter {
    private inner;
    private cache;
    private cacheTtlMs;
    constructor(inner: WorkerStateAdapter, cacheTtlMs?: number);
    init(): Promise<boolean>;
    upsert(worker: WorkerState): Promise<boolean>;
    get(workerId: string): Promise<WorkerState | null>;
    list(filter?: WorkerFilter): Promise<WorkerState[]>;
    delete(workerId: string): Promise<boolean>;
    healthCheck(workerId: string, maxHeartbeatAge?: number): Promise<HealthStatus>;
    batchUpsert(workers: WorkerState[]): Promise<number>;
    cleanup(maxAgeMs: number): Promise<number>;
    close(): Promise<void>;
}
//# sourceMappingURL=cached-adapter.d.ts.map
/**
 * Worker State Adapter Interface
 */
import type { WorkerState, WorkerFilter, HealthStatus } from './types.js';
export interface WorkerStateAdapter {
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
//# sourceMappingURL=adapter.d.ts.map
/**
 * JSON Worker State Adapter
 */
import type { WorkerState, WorkerFilter, HealthStatus } from './types.js';
import type { WorkerStateAdapter } from './adapter.js';
export declare class JsonWorkerAdapter implements WorkerStateAdapter {
    private cwd;
    private stateDir;
    constructor(cwd: string);
    init(): Promise<boolean>;
    upsert(worker: WorkerState): Promise<boolean>;
    get(workerId: string): Promise<WorkerState | null>;
    list(filter?: WorkerFilter): Promise<WorkerState[]>;
    delete(workerId: string): Promise<boolean>;
    healthCheck(workerId: string, maxHeartbeatAge?: number): Promise<HealthStatus>;
    batchUpsert(workers: WorkerState[]): Promise<number>;
    cleanup(maxAgeMs: number): Promise<number>;
    close(): Promise<void>;
    private getWorkerFilePath;
    private matchesFilter;
}
//# sourceMappingURL=json-adapter.d.ts.map
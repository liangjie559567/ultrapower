/**
 * T-019: Concurrency Control Mechanism
 * - Version checking
 * - Conflict retry with exponential backoff
 * - Deadlock detection
 */
export interface VersionedState {
    version: number;
    data: any;
    timestamp: number;
}
export interface ConcurrencyConfig {
    maxRetries?: number;
    baseDelayMs?: number;
    deadlockTimeoutMs?: number;
}
export declare class ConcurrencyControl {
    private locks;
    private config;
    constructor(config?: ConcurrencyConfig);
    /**
     * Version check: ensure state hasn't changed
     */
    checkVersion(current: number, expected: number): void;
    /**
     * Retry with exponential backoff on conflict
     */
    retryOnConflict<T>(operation: () => Promise<T>, resourceId: string): Promise<T>;
    /**
     * Acquire lock with deadlock detection
     */
    acquireLock(resourceId: string, holderId: string): Promise<void>;
    /**
     * Release lock
     */
    releaseLock(resourceId: string, holderId: string): void;
    /**
     * Check for deadlocks
     */
    detectDeadlocks(): string[];
}
//# sourceMappingURL=concurrency-control.d.ts.map
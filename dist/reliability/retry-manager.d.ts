export interface RetryOptions {
    maxRetries?: number;
    baseDelay?: number;
    operation?: string;
}
export interface RetryResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
}
export declare class RetryManager {
    private maxRetries;
    private baseDelay;
    private operation?;
    constructor(options?: RetryOptions);
    execute<T>(fn: () => Promise<T>): Promise<RetryResult<T>>;
    private sleep;
}
//# sourceMappingURL=retry-manager.d.ts.map
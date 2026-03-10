export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerConfig {
    failureThreshold?: number;
    resetTimeout?: number;
}
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private readonly failureThreshold;
    private readonly resetTimeout;
    private nextAttempt;
    constructor(config?: CircuitBreakerConfig);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): CircuitState;
    getFailureCount(): number;
    reset(): void;
}
//# sourceMappingURL=circuit-breaker.d.ts.map
/**
 * Timeout wrapper for hook operations
 * Prevents hooks from blocking tool execution indefinitely
 */
export interface TimeoutOptions {
    timeoutMs: number;
    label: string;
    onTimeout?: (elapsed: number) => void;
    fallback?: () => unknown;
}
/**
 * Execute a promise with timeout
 * Returns undefined if timeout occurs, otherwise returns the result
 */
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T | undefined>;
/**
 * Execute a sync function with timeout (for compatibility)
 */
export declare function withTimeoutSync<T>(fn: () => T, options: TimeoutOptions): T | undefined;
/**
 * Default fallback for pre-tool-use hooks
 */
export declare function defaultPreToolFallback(): {
    continue: boolean;
};
/**
 * Default fallback for post-tool-use hooks
 */
export declare function defaultPostToolFallback(): {
    continue: boolean;
};
//# sourceMappingURL=timeout-wrapper.d.ts.map
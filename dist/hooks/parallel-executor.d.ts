/**
 * Hook Parallel Executor
 *
 * 基于依赖图的并行调度引擎
 */
import type { DependencyGraph } from './dependency-analyzer.js';
export interface ParallelExecutorOptions {
    maxConcurrency?: number;
    onError?: (hookType: string, error: Error) => void;
}
export interface ExecutionResult {
    hookType: string;
    success: boolean;
    duration: number;
    error?: Error;
}
export declare class ParallelExecutor {
    private maxConcurrency;
    private onError?;
    constructor(options?: ParallelExecutorOptions);
    execute(graph: DependencyGraph, hookExecutors: Map<string, () => Promise<void>>): Promise<ExecutionResult[]>;
    private executeHook;
}
//# sourceMappingURL=parallel-executor.d.ts.map
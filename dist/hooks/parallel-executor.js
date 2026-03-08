/**
 * Hook Parallel Executor
 *
 * 基于依赖图的并行调度引擎
 */
export class ParallelExecutor {
    maxConcurrency;
    onError;
    constructor(options = {}) {
        this.maxConcurrency = options.maxConcurrency ?? 4;
        this.onError = options.onError;
    }
    async execute(graph, hookExecutors) {
        const results = [];
        const completed = new Set();
        const inProgress = new Set();
        const pending = new Set(graph.nodes.map(n => n.hookType));
        while (pending.size > 0 || inProgress.size > 0) {
            // 找出可以执行的 hooks（依赖已完成）
            const ready = Array.from(pending).filter(hookType => {
                const deps = graph.edges
                    .filter(e => e.to === hookType)
                    .map(e => e.from);
                return deps.every(dep => completed.has(dep));
            });
            // 启动新任务（不超过并发限制）
            const available = this.maxConcurrency - inProgress.size;
            const toStart = ready.slice(0, available);
            for (const hookType of toStart) {
                pending.delete(hookType);
                inProgress.add(hookType);
                const executor = hookExecutors.get(hookType);
                if (!executor) {
                    results.push({
                        hookType,
                        success: false,
                        duration: 0,
                        error: new Error(`No executor for ${hookType}`),
                    });
                    inProgress.delete(hookType);
                    continue;
                }
                // 异步执行（错误隔离）
                this.executeHook(hookType, executor).then(result => {
                    results.push(result);
                    inProgress.delete(hookType);
                    if (result.success) {
                        completed.add(hookType);
                    }
                    else if (this.onError) {
                        this.onError(hookType, result.error);
                    }
                });
            }
            // 等待至少一个任务完成
            if (inProgress.size > 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        return results;
    }
    async executeHook(hookType, executor) {
        const start = performance.now();
        try {
            await executor();
            return {
                hookType,
                success: true,
                duration: performance.now() - start,
            };
        }
        catch (error) {
            return {
                hookType,
                success: false,
                duration: performance.now() - start,
                error: error,
            };
        }
    }
}
//# sourceMappingURL=parallel-executor.js.map
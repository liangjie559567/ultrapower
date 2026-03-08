/**
 * Agent 超时管理器
 * 负责监控 Agent 执行时间并在超时时中断
 */
export interface TimeoutEvent {
    agentType: string;
    model?: string;
    startTime: number;
    timeoutMs: number;
    actualDuration: number;
}
export declare class TimeoutManager {
    private timers;
    private startTimes;
    private readonly MAX_CONCURRENT_TASKS;
    /**
     * 启动超时监控
     */
    start(taskId: string, agentType: string, model?: string): AbortController;
    /**
     * 停止超时监控
     */
    stop(taskId: string): void;
    /**
     * 获取已运行时间
     */
    getElapsed(taskId: string): number;
    private cleanup;
}
export declare const timeoutManager: TimeoutManager;
//# sourceMappingURL=timeout-manager.d.ts.map
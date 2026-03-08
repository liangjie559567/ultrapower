/**
 * session-watchdog.ts — 会话看门狗
 *
 * 注册 Stop 事件，检测会话超时并清理状态。
 * 对齐 Python session_watchdog.py：通过轮询文件修改时间监控活跃度。
 */
export interface WatchdogOptions {
    timeoutMs?: number;
    pollIntervalMs?: number;
    baseDir?: string;
}
export declare class SessionWatchdog {
    private readonly activeContextFile;
    private readonly timeoutMs;
    private readonly pollIntervalMs;
    private startTime;
    private pollTimer;
    constructor(options?: WatchdogOptions);
    /** 启动轮询监控（对齐 Python 文件修改时间监控） */
    startPolling(): void;
    /** 停止轮询 */
    stopPolling(): void;
    /** 检查文件最后修改时间，超时则触发 onTimeout（对齐 Python 轮询逻辑） */
    private checkFileActivity;
    isTimedOut(): boolean;
    onStop(reason?: string): Promise<void>;
    onTimeout(): Promise<void>;
    private updateStatus;
}
//# sourceMappingURL=session-watchdog.d.ts.map
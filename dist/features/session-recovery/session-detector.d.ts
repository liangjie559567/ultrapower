/**
 * 会话中断检测器
 */
export interface InterruptedTaskResult {
    hasTask: boolean;
    taskDescription?: string;
}
/**
 * 检测中断的任务
 */
export declare function detectInterruptedTask(directory: string): InterruptedTaskResult;
//# sourceMappingURL=session-detector.d.ts.map
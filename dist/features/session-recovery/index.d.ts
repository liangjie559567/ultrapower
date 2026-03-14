/**
 * 会话恢复机制 - F3.1
 * 启动时读取知识库、检测中断任务、语义检索相关知识
 */
export interface SessionRecoveryResult {
    hasInterruptedTask: boolean;
    taskDescription?: string;
    relevantKnowledge: Array<{
        content: string;
        score: number;
    }>;
    loadTimeMs: number;
}
/**
 * 会话恢复入口
 * @param directory 工作目录
 * @returns 恢复结果
 */
export declare function recoverSession(directory: string): Promise<SessionRecoveryResult>;
//# sourceMappingURL=index.d.ts.map
/**
 * session-reflector.ts — 会话结束自动反思触发器
 *
 * 在会话结束时自动触发 Axiom 反思流程，将 modesUsed 入队学习队列。
 */
export interface SessionReflectInput {
    sessionId: string;
    directory: string;
    durationMs?: number;
    agentsSpawned?: number;
    agentsCompleted?: number;
    modesUsed?: string[];
    reason?: string;
}
export interface SessionReflectResult {
    reflected: boolean;
    reportPath?: string;
    queuedItems: number;
    error?: string;
}
export declare function reflectOnSessionEnd(input: SessionReflectInput): Promise<SessionReflectResult>;
//# sourceMappingURL=session-reflector.d.ts.map
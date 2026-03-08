/**
 * Agent 调用包装器
 * 为 Agent 调用添加超时保护和降级策略
 */
export interface AgentCallOptions {
    agentType: string;
    model?: string;
    prompt: string;
    maxRetries?: number;
}
export interface AgentCallResult {
    success: boolean;
    output?: string;
    error?: string;
    timedOut?: boolean;
    retried?: boolean;
}
/**
 * 带超时保护的 Agent 调用
 */
export declare function callAgentWithTimeout(agentFn: (signal: AbortSignal) => Promise<string>, options: AgentCallOptions): Promise<AgentCallResult>;
//# sourceMappingURL=agent-wrapper.d.ts.map
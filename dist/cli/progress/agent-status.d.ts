/**
 * Agent 状态指示器
 */
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'timeout';
export interface AgentInfo {
    name: string;
    status: AgentStatus;
    progress?: string;
}
export declare class AgentStatusIndicator {
    private agents;
    add(name: string, status?: AgentStatus): void;
    update(name: string, status: AgentStatus, progress?: string): void;
    render(): void;
    summary(): {
        total: number;
        completed: number;
        failed: number;
        running: number;
    };
}
//# sourceMappingURL=agent-status.d.ts.map
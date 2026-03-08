export interface AgentRunRecord {
    id: string;
    session_id: string;
    parent_run_id?: string;
    agent_type: string;
    model: string;
    start_time: number;
    end_time?: number;
    duration_ms?: number;
    status: 'running' | 'completed' | 'failed';
}
export declare class AgentTracker {
    private _queue;
    startRun(opts: Omit<AgentRunRecord, 'id' | 'start_time' | 'status'>): string;
    endRun(id: string, status?: 'completed' | 'failed'): void;
}
export declare const agentTracker: AgentTracker;
//# sourceMappingURL=agent-tracker.d.ts.map
export interface AgentRunSummary {
    agent_type: string;
    count: number;
    avg_ms: number;
    total_ms: number;
}
export interface ToolCallSummary {
    tool_name: string;
    count: number;
    avg_ms: number;
    p95_ms: number;
    failure_rate: number;
}
export interface CostSummary {
    model: string;
    total_cost_usd: number;
    total_input_tokens: number;
    total_output_tokens: number;
}
export declare class QueryEngine {
    getAgentRuns(opts?: {
        session_id?: string;
        agent_type?: string;
        last?: number;
    }): AgentRunSummary[];
    getToolCalls(opts?: {
        session_id?: string;
        tool_name?: string;
        last?: number;
    }): ToolCallSummary[];
    getCostSummary(opts?: {
        session_id?: string;
    }): CostSummary[];
}
export declare const queryEngine: QueryEngine;
//# sourceMappingURL=query-engine.d.ts.map
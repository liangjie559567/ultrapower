export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    cache_write_tokens?: number;
    cache_read_tokens?: number;
}
export declare class CostEstimator {
    private _queue;
    estimateCost(model: string, usage: TokenUsage): number;
    record(opts: {
        session_id: string;
        agent_run_id?: string;
        model: string;
        usage: TokenUsage;
    }): void;
}
export declare const costEstimator: CostEstimator;
//# sourceMappingURL=cost-estimator.d.ts.map
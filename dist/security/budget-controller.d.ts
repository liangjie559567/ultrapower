/**
 * T-013: Budget Control
 * - maxTokens/maxCost enforcement
 * - Auto-stop on limit exceeded
 */
export interface BudgetConfig {
    maxTokens?: number;
    maxCost?: number;
}
export interface UsageStats {
    tokens: number;
    cost: number;
}
export declare class BudgetController {
    private config;
    private usage;
    constructor(config: BudgetConfig);
    track(tokens: number, cost: number): void;
    check(): void;
    getUsage(): UsageStats;
    reset(): void;
}
//# sourceMappingURL=budget-controller.d.ts.map
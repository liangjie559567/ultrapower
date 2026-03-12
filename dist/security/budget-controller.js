/**
 * T-013: Budget Control
 * - maxTokens/maxCost enforcement
 * - Auto-stop on limit exceeded
 */
export class BudgetController {
    config;
    usage = { tokens: 0, cost: 0 };
    constructor(config) {
        this.config = config;
    }
    track(tokens, cost) {
        this.usage.tokens += tokens;
        this.usage.cost += cost;
    }
    check() {
        if (this.config.maxTokens && this.usage.tokens > this.config.maxTokens) {
            throw new Error(`Token budget exceeded: ${this.usage.tokens}/${this.config.maxTokens}`);
        }
        if (this.config.maxCost && this.usage.cost > this.config.maxCost) {
            throw new Error(`Cost budget exceeded: $${this.usage.cost.toFixed(2)}/$${this.config.maxCost.toFixed(2)}`);
        }
    }
    getUsage() {
        return { ...this.usage };
    }
    reset() {
        this.usage = { tokens: 0, cost: 0 };
    }
}
//# sourceMappingURL=budget-controller.js.map
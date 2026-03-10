/**
 * T-013: Budget Control
 * - maxTokens/maxCost enforcement
 * - Auto-stop on limit exceeded
 */

export interface BudgetConfig {
  maxTokens?: number;
  maxCost?: number; // USD
}

export interface UsageStats {
  tokens: number;
  cost: number;
}

export class BudgetController {
  private usage: UsageStats = { tokens: 0, cost: 0 };

  constructor(private config: BudgetConfig) {}

  track(tokens: number, cost: number): void {
    this.usage.tokens += tokens;
    this.usage.cost += cost;
  }

  check(): void {
    if (this.config.maxTokens && this.usage.tokens > this.config.maxTokens) {
      throw new Error(`Token budget exceeded: ${this.usage.tokens}/${this.config.maxTokens}`);
    }
    if (this.config.maxCost && this.usage.cost > this.config.maxCost) {
      throw new Error(`Cost budget exceeded: $${this.usage.cost.toFixed(2)}/$${this.config.maxCost.toFixed(2)}`);
    }
  }

  getUsage(): UsageStats {
    return { ...this.usage };
  }

  reset(): void {
    this.usage = { tokens: 0, cost: 0 };
  }
}

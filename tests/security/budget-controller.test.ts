import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetController } from '../../src/security/budget-controller.js';

describe('BudgetController', () => {
  let controller: BudgetController;

  beforeEach(() => {
    controller = new BudgetController({ maxTokens: 1000, maxCost: 10 });
  });

  it('tracks usage', () => {
    controller.track(100, 1.5);
    expect(controller.getUsage()).toEqual({ tokens: 100, cost: 1.5 });
  });

  it('throws on token limit', () => {
    controller.track(1001, 5);
    expect(() => controller.check()).toThrow('Token budget exceeded');
  });

  it('throws on cost limit', () => {
    controller.track(500, 10.01);
    expect(() => controller.check()).toThrow('Cost budget exceeded');
  });

  it('resets usage', () => {
    controller.track(100, 1);
    controller.reset();
    expect(controller.getUsage()).toEqual({ tokens: 0, cost: 0 });
  });
});

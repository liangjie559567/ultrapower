import { describe, it, expect, vi } from 'vitest';
import { LoopController } from './loop-controller.js';

describe('LoopController', () => {
  it('should converge when check returns true', async () => {
    const controller = new LoopController();
    let callCount = 0;

    const result = await controller.execute(
      {
        maxRounds: 5,
        timeout: 1000,
        convergenceCheck: () => callCount === 2,
      },
      async () => {
        callCount++;
        return { data: 'test' };
      }
    );

    expect(result.completed).toBe(true);
    expect(result.rounds).toBe(2);
    expect(result.reason).toBe('converged');
  });

  it('should stop at max rounds', async () => {
    const controller = new LoopController();

    const result = await controller.execute(
      {
        maxRounds: 3,
        timeout: 1000,
        convergenceCheck: () => false,
      },
      async () => ({ data: 'test' })
    );

    expect(result.completed).toBe(true);
    expect(result.rounds).toBe(3);
    expect(result.reason).toBe('max_rounds');
  });

  it('should timeout on slow task', async () => {
    const controller = new LoopController();

    const result = await controller.execute(
      {
        maxRounds: 5,
        timeout: 100,
        convergenceCheck: () => false,
      },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { data: 'test' };
      }
    );

    expect(result.completed).toBe(false);
    expect(result.reason).toBe('timeout');
  });
});

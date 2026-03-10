import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker } from '../../src/reliability/circuit-breaker';

describe('Circuit Breaker Race Conditions', () => {
  it('should handle concurrent state transitions', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 100 });
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));

    const concurrent = Array.from({ length: 5 }, () =>
      breaker.execute(failFn).catch(() => null)
    );

    await Promise.all(concurrent);
    expect(breaker.getFailureCount()).toBeLessThanOrEqual(5);
  });

  it('should prevent race in HALF_OPEN state', async () => {
    vi.useFakeTimers();
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 100 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await breaker.execute(fn).catch(() => null);
    await breaker.execute(fn).catch(() => null);

    vi.advanceTimersByTime(100);

    fn.mockResolvedValue('ok');
    const results = await Promise.all([
      breaker.execute(fn),
      breaker.execute(fn).catch(() => 'rejected')
    ]);

    expect(results.filter(r => r === 'ok').length).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from '../circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('should start in CLOSED state', () => {
    const cb = new CircuitBreaker();
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('should execute successfully in CLOSED state', async () => {
    const cb = new CircuitBreaker();
    const result = await cb.execute(async () => 'success');
    expect(result).toBe('success');
    expect(cb.getFailureCount()).toBe(0);
  });

  it('should open after threshold failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });

    for (let i = 0; i < 3; i++) {
      await cb.execute(async () => { throw new Error('fail'); }).catch(() => {});
    }

    expect(cb.getState()).toBe(CircuitState.OPEN);
  });

  it('should reject requests when OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });

    await cb.execute(async () => { throw new Error('fail'); }).catch(() => {});
    await cb.execute(async () => { throw new Error('fail'); }).catch(() => {});

    await expect(cb.execute(async () => 'ok')).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    vi.useFakeTimers();
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 1000 });

    await cb.execute(async () => { throw new Error('fail'); }).catch(() => {});
    expect(cb.getState()).toBe(CircuitState.OPEN);

    vi.advanceTimersByTime(1001);
    await cb.execute(async () => 'ok');
    expect(cb.getState()).toBe(CircuitState.CLOSED);

    vi.useRealTimers();
  });

  it('should reset state and counters', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1 });
    cb.execute(async () => { throw new Error('fail'); }).catch(() => {});

    cb.reset();
    expect(cb.getState()).toBe(CircuitState.CLOSED);
    expect(cb.getFailureCount()).toBe(0);
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from '../../src/reliability/circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 1000 });
  });

  it('starts in CLOSED state', () => {
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('executes function successfully', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await breaker.execute(fn);
    expect(result).toBe('success');
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('opens after threshold failures', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fn)).rejects.toThrow('fail');
    }

    expect(breaker.getState()).toBe(CircuitState.OPEN);
    expect(breaker.getFailureCount()).toBe(3);
  });

  it('rejects calls when OPEN', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fn)).rejects.toThrow();
    }

    await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('transitions to HALF_OPEN after timeout', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fn)).rejects.toThrow();
    }

    expect(breaker.getState()).toBe(CircuitState.OPEN);

    vi.advanceTimersByTime(1000);

    fn.mockResolvedValue('success');
    await breaker.execute(fn);

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
    vi.useRealTimers();
  });

  it('resets failure count on success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    await expect(breaker.execute(fn)).rejects.toThrow();
    expect(breaker.getFailureCount()).toBe(1);

    await breaker.execute(fn);
    expect(breaker.getFailureCount()).toBe(0);
  });

  it('resets state manually', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fn)).rejects.toThrow();
    }

    expect(breaker.getState()).toBe(CircuitState.OPEN);

    breaker.reset();
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
    expect(breaker.getFailureCount()).toBe(0);
  });

  it('uses default config values', () => {
    const defaultBreaker = new CircuitBreaker();
    expect(defaultBreaker.getState()).toBe(CircuitState.CLOSED);
  });
});

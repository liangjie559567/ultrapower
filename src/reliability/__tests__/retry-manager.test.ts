import { describe, it, expect, vi } from 'vitest';
import { RetryManager } from '../retry-manager.js';

describe('RetryManager', () => {
  it('should succeed on first attempt', async () => {
    const rm = new RetryManager();
    const result = await rm.execute(async () => 'success');

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(1);
  });

  it('should retry on failure', async () => {
    const rm = new RetryManager({ maxRetries: 2, baseDelay: 10 });
    let attempts = 0;

    const result = await rm.execute(async () => {
      attempts++;
      if (attempts < 2) throw new Error('fail');
      return 'success';
    });

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it('should fail after max retries', async () => {
    const rm = new RetryManager({ maxRetries: 2, baseDelay: 10 });

    const result = await rm.execute(async () => {
      throw new Error('always fail');
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(result.error?.message).toBe('always fail');
  });

  it('should use exponential backoff', async () => {
    vi.useFakeTimers();
    const rm = new RetryManager({ maxRetries: 2, baseDelay: 100 });
    const _attempts = 0;

    const promise = rm.execute(async () => {
      attempts++;
      throw new Error('fail');
    });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result.attempts).toBe(3);
    vi.useRealTimers();
  });

  it('should skip retry for non-retryable operations', async () => {
    const rm = new RetryManager({ operation: 'git-push' });

    const result = await rm.execute(async () => {
      throw new Error('fail');
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
  });
});
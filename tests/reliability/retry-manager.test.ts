import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetryManager } from '../../src/reliability/retry-manager';

describe('RetryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const manager = new RetryManager();
    const fn = vi.fn().mockResolvedValue('success');

    const result = await manager.execute(fn);

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const manager = new RetryManager({ baseDelay: 10 });
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockResolvedValueOnce('success');

    const result = await manager.execute(fn);

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    const manager = new RetryManager({ maxRetries: 2, baseDelay: 10 });
    const error = new Error('persistent failure');
    const fn = vi.fn().mockRejectedValue(error);

    const result = await manager.execute(fn);

    expect(result.success).toBe(false);
    expect(result.error).toBe(error);
    expect(result.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff', async () => {
    const manager = new RetryManager({ maxRetries: 3, baseDelay: 100 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const start = Date.now();
    await manager.execute(fn);
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThanOrEqual(700);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('should use default options', async () => {
    const manager = new RetryManager();
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const result = await manager.execute(fn);

    expect(result.attempts).toBe(4);
    expect(fn).toHaveBeenCalledTimes(4);
  });
});

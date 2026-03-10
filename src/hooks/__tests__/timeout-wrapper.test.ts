import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, defaultPreToolFallback, defaultPostToolFallback } from '../timeout-wrapper.js';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return result when promise resolves within timeout', async () => {
    const fn = vi.fn(async () => 'success');
    const result = await withTimeout(fn, {
      timeoutMs: 1000,
      label: 'test-op',
    });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalled();
  });

  it('should return fallback when promise times out', async () => {
    const fn = vi.fn(() => new Promise(() => {})); // Never resolves
    const fallback = vi.fn(() => ({ continue: true }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const promise = withTimeout(fn, {
      timeoutMs: 1000,
      label: 'test-timeout',
      fallback,
    });

    vi.advanceTimersByTime(1000);
    const result = await promise;

    expect(result).toEqual({ continue: true });
    expect(fallback).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[hook-bridge] test-timeout timeout after 1000ms')
    );
  });

  it('should call onTimeout callback when timeout occurs', async () => {
    const fn = vi.fn(() => new Promise(() => {}));
    const onTimeout = vi.fn();

    const promise = withTimeout(fn, {
      timeoutMs: 500,
      label: 'test-callback',
      onTimeout,
    });

    vi.advanceTimersByTime(500);
    await promise;

    expect(onTimeout).toHaveBeenCalledWith(500);
  });

  it('should throw non-timeout errors', async () => {
    const error = new Error('Custom error');
    const fn = vi.fn(async () => {
      throw error;
    });

    await expect(
      withTimeout(fn, {
        timeoutMs: 1000,
        label: 'test-error',
      })
    ).rejects.toThrow('Custom error');
  });
});

describe('defaultPreToolFallback', () => {
  it('should return continue: true', () => {
    const result = defaultPreToolFallback();
    expect(result).toEqual({ continue: true });
  });
});

describe('defaultPostToolFallback', () => {
  it('should return continue: true', () => {
    const result = defaultPostToolFallback();
    expect(result).toEqual({ continue: true });
  });
});

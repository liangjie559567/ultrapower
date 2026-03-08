import { describe, it, expect, vi } from 'vitest';
import { executeWithFallback, isCodexAvailable } from './codex-fallback.js';

describe('Codex Fallback Strategy', () => {
  it('should use Codex when available', async () => {
    const codexFn = vi.fn().mockResolvedValue('codex-result');
    const fallbackFn = vi.fn().mockResolvedValue('fallback-result');

    const result = await executeWithFallback(codexFn, fallbackFn, 'test-task');

    expect(result.success).toBe(true);
    expect(result.data).toBe('codex-result');
    expect(result.fallbackUsed).toBe(false);
    expect(codexFn).toHaveBeenCalled();
    expect(fallbackFn).not.toHaveBeenCalled();
  });

  it('should fallback to Agent on Codex timeout', async () => {
    const codexFn = vi.fn().mockImplementation(() =>
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 31000))
    );
    const fallbackFn = vi.fn().mockResolvedValue('fallback-result');

    const result = await executeWithFallback(codexFn, fallbackFn, 'test-task');

    expect(result.success).toBe(true);
    expect(result.data).toBe('fallback-result');
    expect(result.fallbackUsed).toBe(true);
    expect(fallbackFn).toHaveBeenCalled();
  }, 35000);

  it('should fallback to Agent on Codex error', async () => {
    const codexFn = vi.fn().mockRejectedValue(new Error('Codex unavailable'));
    const fallbackFn = vi.fn().mockResolvedValue('fallback-result');

    const result = await executeWithFallback(codexFn, fallbackFn, 'test-task');

    expect(result.success).toBe(true);
    expect(result.data).toBe('fallback-result');
    expect(result.fallbackUsed).toBe(true);
  });

  it('should fail when both Codex and fallback fail', async () => {
    const codexFn = vi.fn().mockRejectedValue(new Error('Codex error'));
    const fallbackFn = vi.fn().mockRejectedValue(new Error('Fallback error'));

    const result = await executeWithFallback(codexFn, fallbackFn, 'test-task');

    expect(result.success).toBe(false);
    expect(result.fallbackUsed).toBe(true);
    expect(result.error).toContain('Codex error');
    expect(result.error).toContain('Fallback error');
  });

  it('should detect Codex availability', () => {
    const available = isCodexAvailable();
    expect(typeof available).toBe('boolean');
  });
});

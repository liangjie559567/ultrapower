import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isSpawnedPid,
  clearSpawnedPids,
  computeBackoffDelay,
  isModelError,
  isRateLimitError,
  isRetryableError,
  parseCodexOutput,
  executeCodexWithFallback,
  CODEX_DEFAULT_MODEL,
  RATE_LIMIT_RETRY_COUNT
} from '../codex-core.js';

describe('Codex Core', () => {
  beforeEach(() => {
    clearSpawnedPids();
  });

  describe('PID tracking', () => {
    it('returns false for untracked PID', () => {
      expect(isSpawnedPid(12345)).toBe(false);
    });

    it('clears tracked PIDs', () => {
      clearSpawnedPids();
      expect(isSpawnedPid(99999)).toBe(false);
    });
  });

  describe('computeBackoffDelay', () => {
    it('returns initial delay with jitter for attempt 0', () => {
      const delay = computeBackoffDelay(0, 1000, 10000);
      expect(delay).toBeGreaterThanOrEqual(500);
      expect(delay).toBeLessThanOrEqual(1000);
    });

    it('caps at max delay', () => {
      const delay = computeBackoffDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });

  describe('isModelError', () => {
    it('detects model not found', () => {
      const result = isModelError('{"type":"error","message":"model_not_found: model bad-model is not supported"}');
      expect(result.isError).toBe(true);
    });

    it('returns false for normal output', () => {
      const result = isModelError('{"type":"content","text":"Success response"}');
      expect(result.isError).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('detects rate limit', () => {
      const result = isRateLimitError('{"type":"error","message":"429 rate limit exceeded"}');
      expect(result.isError).toBe(true);
    });

    it('returns false for normal output', () => {
      const result = isRateLimitError('{"type":"content","text":"Success"}');
      expect(result.isError).toBe(false);
    });
  });

  describe('parseCodexOutput', () => {
    it('returns output as-is when valid', () => {
      const output = 'Test response';
      expect(parseCodexOutput(output)).toBe(output);
    });

    it('handles empty output', () => {
      expect(parseCodexOutput('')).toBe('');
    });
  });

  describe('constants', () => {
    it('exports default model', () => {
      expect(typeof CODEX_DEFAULT_MODEL).toBe('string');
    });

    it('exports retry count', () => {
      expect(RATE_LIMIT_RETRY_COUNT).toBeGreaterThan(0);
    });
  });

  describe('parseCodexOutput - extended', () => {
    it('extracts text from item.completed events', () => {
      const jsonl = '{"type":"item.completed","item":{"type":"agent_message","text":"Response text"}}';
      expect(parseCodexOutput(jsonl)).toBe('Response text');
    });

    it('extracts text from message events', () => {
      const jsonl = '{"type":"message","content":"Message text"}';
      expect(parseCodexOutput(jsonl)).toBe('Message text');
    });

    it('extracts text from content array', () => {
      const jsonl = '{"type":"message","content":[{"type":"text","text":"Array text"}]}';
      expect(parseCodexOutput(jsonl)).toBe('Array text');
    });

    it('extracts text from output_text events', () => {
      const jsonl = '{"type":"output_text","text":"Output text"}';
      expect(parseCodexOutput(jsonl)).toBe('Output text');
    });

    it('handles multiple events', () => {
      const jsonl = '{"type":"output_text","text":"First"}\n{"type":"output_text","text":"Second"}';
      expect(parseCodexOutput(jsonl)).toBe('First\nSecond');
    });

    it('skips non-JSON lines', () => {
      const mixed = 'progress...\n{"type":"output_text","text":"Valid"}';
      expect(parseCodexOutput(mixed)).toContain('Valid');
    });
  });

  describe('isRetryableError', () => {
    it('detects model errors', () => {
      const result = isRetryableError('{"type":"error","message":"model_not_found"}');
      expect(result.isError).toBe(true);
      expect(result.type).toBe('model');
    });

    it('detects rate limit errors', () => {
      const result = isRetryableError('{"type":"error","message":"429 rate limit"}');
      expect(result.isError).toBe(true);
      expect(result.type).toBe('rate_limit');
    });

    it('returns none for normal output', () => {
      const result = isRetryableError('{"type":"content","text":"OK"}');
      expect(result.isError).toBe(false);
      expect(result.type).toBe('none');
    });
  });

  describe('executeCodexWithFallback', () => {
    it('succeeds on first try with explicit model', async () => {
      const mockExec = vi.fn().mockResolvedValue('Success');
      const result = await executeCodexWithFallback('test', 'gpt-5.3-codex', undefined, undefined, { executor: mockExec });
      expect(result.response).toBe('Success');
      expect(result.usedFallback).toBe(false);
      expect(result.actualModel).toBe('gpt-5.3-codex');
      expect(mockExec).toHaveBeenCalledTimes(1);
    });

    it('retries on rate limit with explicit model', async () => {
      const mockExec = vi.fn()
        .mockRejectedValueOnce(new Error('429 rate limit'))
        .mockResolvedValueOnce('Success');
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const result = await executeCodexWithFallback('test', 'gpt-5.3-codex', undefined, undefined, { executor: mockExec, sleepFn: mockSleep });
      expect(result.response).toBe('Success');
      expect(mockExec).toHaveBeenCalledTimes(2);
      expect(mockSleep).toHaveBeenCalledTimes(1);
    });

    it('throws non-rate-limit error immediately with explicit model', async () => {
      const mockExec = vi.fn().mockRejectedValue(new Error('Network error'));
      await expect(executeCodexWithFallback('test', 'gpt-5.3-codex', undefined, undefined, { executor: mockExec }))
        .rejects.toThrow('Network error');
      expect(mockExec).toHaveBeenCalledTimes(1);
    });

    it('uses fallback chain when model not explicit', async () => {
      const mockExec = vi.fn()
        .mockRejectedValueOnce(new Error('model_not_found'))
        .mockResolvedValueOnce('Success from fallback');
      const result = await executeCodexWithFallback('test', undefined, undefined, ['gpt-5.3-codex', 'gpt-4o'], { executor: mockExec });
      expect(result.response).toBe('Success from fallback');
      expect(result.usedFallback).toBe(true);
      expect(mockExec).toHaveBeenCalledTimes(2);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseTokenLimitError,
  containsTokenLimitError,
  handleContextWindowRecovery,
  detectContextLimitError
} from '../context-window.js';

describe('Context Window Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseTokenLimitError', () => {
    it('parses string error with token counts', () => {
      const error = 'prompt is too long: 210000 tokens > 200000 maximum';
      const result = parseTokenLimitError(error);
      expect(result).not.toBeNull();
      expect(result?.currentTokens).toBe(210000);
      expect(result?.maxTokens).toBe(200000);
    });

    it('parses object error with message field', () => {
      const error = { message: 'prompt is too long: 150000 tokens > 100000 maximum' };
      const result = parseTokenLimitError(error);
      expect(result).not.toBeNull();
      expect(result?.currentTokens).toBe(150000);
      expect(result?.maxTokens).toBe(100000);
    });

    it('parses nested error object', () => {
      const error = {
        data: {
          error: {
            message: 'prompt is too long: 180000 tokens > 160000 maximum'
          }
        }
      };
      const result = parseTokenLimitError(error);
      expect(result).not.toBeNull();
      expect(result?.currentTokens).toBe(180000);
      expect(result?.maxTokens).toBe(160000);
    });

    it('parses Bedrock error format', () => {
      const error = {
        message: JSON.stringify({
          message: 'prompt is too long: 220000 tokens > 200000 maximum'
        })
      };
      const result = parseTokenLimitError(error);
      expect(result).not.toBeNull();
      expect(result?.currentTokens).toBe(220000);
      expect(result?.maxTokens).toBe(200000);
    });

    it('returns null for non-token-limit error', () => {
      const error = 'some other error';
      const result = parseTokenLimitError(error);
      expect(result).toBeNull();
    });

    it('returns null for thinking block error', () => {
      const error = 'thinking must start with first block';
      const result = parseTokenLimitError(error);
      expect(result).toBeNull();
    });

    it('returns null for empty content error', () => {
      const error = 'empty content in message';
      const result = parseTokenLimitError(error);
      expect(result).toBeNull();
    });

    it('handles error without token counts', () => {
      const error = 'prompt is too long';
      const result = parseTokenLimitError(error);
      expect(result).not.toBeNull();
      expect(result?.currentTokens).toBe(0);
      expect(result?.maxTokens).toBe(0);
      expect(result?.errorType).toBe('token_limit_exceeded_string');
    });
  });

  describe('containsTokenLimitError', () => {
    it('detects token limit error', () => {
      const text = 'prompt is too long: 210000 tokens > 200000 maximum';
      expect(containsTokenLimitError(text)).toBe(true);
    });

    it('detects "too many tokens" error', () => {
      const text = 'too many tokens in prompt';
      expect(containsTokenLimitError(text)).toBe(true);
    });

    it('returns false for normal text', () => {
      const text = 'normal output text';
      expect(containsTokenLimitError(text)).toBe(false);
    });

    it('returns false for thinking block error', () => {
      const text = 'thinking must start with first block';
      expect(containsTokenLimitError(text)).toBe(false);
    });
  });

  describe('handleContextWindowRecovery', () => {
    it('returns not attempted for non-context-limit error', () => {
      const result = handleContextWindowRecovery('session-1', { message: 'unknown error' });
      expect(result.attempted).toBe(false);
      expect(result.success).toBe(false);
    });

    it('handles context limit error on first attempt', () => {
      const error = { message: 'prompt is too long: 210000 tokens > 200000 maximum' };
      const result = handleContextWindowRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.errorType).toBe('token_limit_exceeded');
      expect(result.message).toContain('CONTEXT WINDOW LIMIT');
    });

    it('handles context limit error on retry', () => {
      const error = { message: 'prompt is too long: 210000 tokens > 200000 maximum' };
      handleContextWindowRecovery('session-2', error);
      const result = handleContextWindowRecovery('session-2', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.message).toContain('CONTEXT WINDOW LIMIT');
    });

    it('handles string error', () => {
      const error = 'prompt is too long: 210000 tokens > 200000 maximum';
      const result = handleContextWindowRecovery('session-3', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });
  });

  describe('detectContextLimitError', () => {
    it('detects context limit error', () => {
      const text = 'prompt is too long: 210000 tokens > 200000 maximum';
      expect(detectContextLimitError(text)).toBe(true);
    });

    it('returns false for normal text', () => {
      const text = 'normal output text';
      expect(detectContextLimitError(text)).toBe(false);
    });
  });
});

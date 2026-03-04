import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createRecoveryHook,
  handleRecovery,
  detectRecoverableError,
  detectEditErrorInOutput,
  parseContextLimitError,
  detectContextLimitErrorInText,
  detectEditErrorInText,
  isSessionRecoverable
} from '../index.js';
import * as contextWindow from '../context-window.js';
import * as sessionRecovery from '../session-recovery.js';
import * as editError from '../edit-error.js';

describe('Recovery Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleRecovery', () => {
    it('returns not attempted when no error provided', async () => {
      const result = await handleRecovery({
        sessionId: 'test-session'
      });
      expect(result.attempted).toBe(false);
      expect(result.success).toBe(false);
    });

    it('handles context window limit error with priority 1', async () => {
      const error = { message: 'prompt is too long: 210000 tokens > 200000 maximum' };
      vi.spyOn(contextWindow, 'handleContextWindowRecovery').mockReturnValue({
        attempted: true,
        success: true,
        errorType: 'context_window_limit'
      });

      const result = await handleRecovery({
        sessionId: 'test-session',
        error
      });

      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.errorType).toBe('context_window_limit');
    });

    it('handles session recovery error with priority 2', async () => {
      const error = { message: 'tool_use requires tool_result' };
      vi.spyOn(contextWindow, 'handleContextWindowRecovery').mockReturnValue({
        attempted: false,
        success: false
      });
      vi.spyOn(sessionRecovery, 'handleSessionRecovery').mockResolvedValue({
        attempted: true,
        success: true,
        errorType: 'tool_result_missing'
      });

      const result = await handleRecovery({
        sessionId: 'test-session',
        error
      });

      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.errorType).toBe('tool_result_missing');
    });

    it('handles edit error with priority 3', async () => {
      vi.spyOn(editError, 'handleEditErrorRecovery').mockReturnValue({
        attempted: true,
        success: true,
        errorType: 'edit_error'
      });

      const result = await handleRecovery({
        sessionId: 'test-session',
        toolName: 'Edit',
        toolOutput: 'Error: old_string not found'
      });

      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('respects priority order: context window > session > edit', async () => {
      const error = { message: 'prompt is too long: 210000 tokens' };
      const contextSpy = vi.spyOn(contextWindow, 'handleContextWindowRecovery').mockReturnValue({
        attempted: true,
        success: true,
        errorType: 'context_window_limit'
      });
      const sessionSpy = vi.spyOn(sessionRecovery, 'handleSessionRecovery');

      await handleRecovery({
        sessionId: 'test-session',
        error,
        toolName: 'Edit',
        toolOutput: 'Error: old_string not found'
      });

      expect(contextSpy).toHaveBeenCalled();
      expect(sessionSpy).not.toHaveBeenCalled();
    });

    it('falls through to next priority when recovery fails', async () => {
      const error = { message: 'tool_use requires tool_result' };
      vi.spyOn(contextWindow, 'handleContextWindowRecovery').mockReturnValue({
        attempted: false,
        success: false
      });
      vi.spyOn(sessionRecovery, 'handleSessionRecovery').mockResolvedValue({
        attempted: true,
        success: false
      });
      vi.spyOn(editError, 'handleEditErrorRecovery').mockReturnValue({
        attempted: true,
        success: true
      });

      const result = await handleRecovery({
        sessionId: 'test-session',
        error,
        toolName: 'Edit',
        toolOutput: 'Error: old_string not found'
      });

      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('returns not attempted when all recoveries fail', async () => {
      const error = { message: 'unknown error' };
      vi.spyOn(contextWindow, 'handleContextWindowRecovery').mockReturnValue({
        attempted: false,
        success: false
      });
      vi.spyOn(sessionRecovery, 'handleSessionRecovery').mockResolvedValue({
        attempted: false,
        success: false
      });

      const result = await handleRecovery({
        sessionId: 'test-session',
        error
      });

      expect(result.attempted).toBe(false);
      expect(result.success).toBe(false);
    });
  });

  describe('createRecoveryHook', () => {
    it('creates hook with all required methods', () => {
      const hook = createRecoveryHook();
      expect(typeof hook.onError).toBe('function');
      expect(typeof hook.afterToolExecute).toBe('function');
      expect(typeof hook.isRecoverable).toBe('function');
      expect(typeof hook.getRecoveryType).toBe('function');
    });

    it('onError handles context window limit', async () => {
      const hook = createRecoveryHook();
      const error = { message: 'prompt is too long: 210000 tokens' };
      vi.spyOn(contextWindow, 'handleContextWindowRecovery').mockReturnValue({
        attempted: true,
        success: true
      });

      const result = await hook.onError({ sessionId: 'test', error });
      expect(result.attempted).toBe(true);
    });

    it('onError handles session recovery', async () => {
      const hook = createRecoveryHook();
      const error = { message: 'tool_use requires tool_result' };
      vi.spyOn(contextWindow, 'handleContextWindowRecovery').mockReturnValue({
        attempted: false,
        success: false
      });
      vi.spyOn(sessionRecovery, 'handleSessionRecovery').mockResolvedValue({
        attempted: true,
        success: true
      });

      const result = await hook.onError({ sessionId: 'test', error });
      expect(result.attempted).toBe(true);
    });

    it('afterToolExecute handles edit errors', () => {
      const hook = createRecoveryHook();
      vi.spyOn(editError, 'handleEditErrorRecovery').mockReturnValue({
        attempted: true,
        success: true
      });

      const result = hook.afterToolExecute({
        sessionId: 'test',
        tool: 'Edit',
        output: 'Error: old_string not found'
      });
      expect(result.recovery?.attempted).toBe(true);
    });

    it('isRecoverable detects context limit errors', () => {
      const hook = createRecoveryHook();
      const error = { message: 'prompt is too long: 210000 tokens' };
      expect(hook.isRecoverable(error)).toBe(true);
    });

    it('isRecoverable detects session errors', () => {
      const hook = createRecoveryHook();
      const error = { message: 'tool_use requires tool_result' };
      expect(hook.isRecoverable(error)).toBe(true);
    });

    it('isRecoverable returns false for unknown errors', () => {
      const hook = createRecoveryHook();
      const error = { message: 'unknown error' };
      expect(hook.isRecoverable(error)).toBe(false);
    });

    it('getRecoveryType returns context_window_limit', () => {
      const hook = createRecoveryHook();
      const error = { message: 'prompt is too long: 210000 tokens' };
      expect(hook.getRecoveryType(error)).toBe('context_window_limit');
    });

    it('getRecoveryType returns thinking_block_order', () => {
      const hook = createRecoveryHook();
      const error = { message: 'thinking must start with first block' };
      expect(hook.getRecoveryType(error)).toBe('thinking_block_order');
    });

    it('getRecoveryType returns null for unknown errors', () => {
      const hook = createRecoveryHook();
      const error = { message: 'unknown error' };
      expect(hook.getRecoveryType(error)).toBeUndefined();
    });
  });

  describe('detectRecoverableError', () => {
    it('detects context window limit error', () => {
      const error = { message: 'prompt is too long: 210000 tokens' };
      const result = detectRecoverableError(error);
      expect(result.recoverable).toBe(true);
      expect(result.type).toBe('context_window_limit');
    });

    it('detects session recovery error', () => {
      const error = { message: 'tool_use requires tool_result' };
      const result = detectRecoverableError(error);
      expect(result.recoverable).toBe(true);
      expect(result.type).toBe('tool_result_missing');
    });

    it('returns not recoverable for unknown error', () => {
      const error = { message: 'unknown error' };
      const result = detectRecoverableError(error);
      expect(result.recoverable).toBe(false);
      expect(result.type).toBeUndefined();
    });
  });

  describe('utility functions', () => {
    it('parseContextLimitError extracts token counts', () => {
      const error = { message: 'prompt is too long: 210000 tokens > 200000 maximum' };
      const result = parseContextLimitError(error);
      expect(result).not.toBeNull();
      expect(result?.currentTokens).toBe(210000);
      expect(result?.maxTokens).toBe(200000);
    });

    it('parseContextLimitError returns null for non-context errors', () => {
      const error = { message: 'unknown error' };
      const result = parseContextLimitError(error);
      expect(result).toBeNull();
    });

    it('detectContextLimitErrorInText detects context limit', () => {
      const text = 'prompt is too long: 210000 tokens > 200000 maximum';
      expect(detectContextLimitErrorInText(text)).toBe(true);
    });

    it('detectContextLimitErrorInText returns false for normal text', () => {
      const text = 'normal output text';
      expect(detectContextLimitErrorInText(text)).toBe(false);
    });

    it('detectEditErrorInText detects edit errors', () => {
      const text = 'Error: old_string not found in file';
      expect(detectEditErrorInText(text)).toBe(true);
    });

    it('detectEditErrorInText returns false for normal text', () => {
      const text = 'normal output text';
      expect(detectEditErrorInText(text)).toBe(false);
    });

    it('detectEditErrorInOutput detects edit errors', () => {
      const output = 'Error: old_string not found';
      expect(detectEditErrorInOutput(output)).toBe(true);
    });

    it('detectEditErrorInOutput returns false for success output', () => {
      const output = 'File updated successfully';
      expect(detectEditErrorInOutput(output)).toBe(false);
    });

    it('isSessionRecoverable detects session errors', () => {
      const error = { message: 'tool_use requires tool_result' };
      expect(isSessionRecoverable(error)).toBe(true);
    });

    it('isSessionRecoverable returns false for non-session errors', () => {
      const error = { message: 'unknown error' };
      expect(isSessionRecoverable(error)).toBe(false);
    });
  });
});
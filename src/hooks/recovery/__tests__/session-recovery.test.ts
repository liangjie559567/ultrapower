import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectErrorType, isRecoverableError, handleSessionRecovery } from '../session-recovery.js';
import * as storage from '../storage.js';

describe('Session Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectErrorType', () => {
    it('detects tool_result_missing error', () => {
      const error = { message: 'tool_use requires tool_result' };
      expect(detectErrorType(error)).toBe('tool_result_missing');
    });

    it('detects thinking_block_order error', () => {
      const error = { message: 'thinking must start with first block' };
      expect(detectErrorType(error)).toBe('thinking_block_order');
    });

    it('detects thinking_disabled_violation error', () => {
      const error = { message: 'thinking is disabled and cannot contain blocks' };
      expect(detectErrorType(error)).toBe('thinking_disabled_violation');
    });

    it('detects empty_content error', () => {
      const error = { message: 'empty content in message' };
      expect(detectErrorType(error)).toBe('empty_content');
    });

    it('returns null for non-recoverable error', () => {
      const error = { message: 'unknown error type' };
      expect(detectErrorType(error)).toBeNull();
    });

    it('handles string error', () => {
      const error = 'tool_use requires tool_result';
      expect(detectErrorType(error)).toBe('tool_result_missing');
    });

    it('handles nested error object', () => {
      const error = { data: { error: { message: 'thinking must start with first block' } } };
      expect(detectErrorType(error)).toBe('thinking_block_order');
    });
  });

  describe('isRecoverableError', () => {
    it('returns true for recoverable error', () => {
      const error = { message: 'tool_use requires tool_result' };
      expect(isRecoverableError(error)).toBe(true);
    });

    it('returns false for non-recoverable error', () => {
      const error = { message: 'unknown error' };
      expect(isRecoverableError(error)).toBe(false);
    });
  });

  describe('handleSessionRecovery', () => {
    it('returns not attempted for non-recoverable error', async () => {
      const result = await handleSessionRecovery('session-1', { message: 'unknown' });
      expect(result.attempted).toBe(false);
      expect(result.success).toBe(false);
    });

    it('handles tool_result_missing error', async () => {
      const error = { message: 'tool_use requires tool_result' };
      const result = await handleSessionRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.errorType).toBe('tool_result_missing');
    });

    it('handles thinking_block_order error with orphan messages', async () => {
      vi.spyOn(storage, 'findMessagesWithOrphanThinking').mockReturnValue(['msg_001']);
      vi.spyOn(storage, 'prependThinkingPart').mockReturnValue(true);
      const error = { message: 'thinking must start with first block' };
      const result = await handleSessionRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.errorType).toBe('thinking_block_order');
      expect(result.success).toBe(true);
    });

    it('handles thinking_block_order error with message index', async () => {
      vi.spyOn(storage, 'findMessageByIndexNeedingThinking').mockReturnValue('msg_002');
      vi.spyOn(storage, 'prependThinkingPart').mockReturnValue(true);
      const error = { message: 'thinking must start with first block at messages.5' };
      const result = await handleSessionRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('handles thinking_disabled_violation error with thinking blocks', async () => {
      vi.spyOn(storage, 'findMessagesWithThinkingBlocks').mockReturnValue(['msg_003']);
      vi.spyOn(storage, 'stripThinkingParts').mockReturnValue(true);
      const error = { message: 'thinking is disabled and cannot contain' };
      const result = await handleSessionRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('handles empty_content error with empty text parts', async () => {
      vi.spyOn(storage, 'findMessagesWithEmptyTextParts').mockReturnValue(['msg_004']);
      vi.spyOn(storage, 'replaceEmptyTextParts').mockReturnValue(true);
      vi.spyOn(storage, 'findMessagesWithThinkingOnly').mockReturnValue([]);
      vi.spyOn(storage, 'findEmptyMessages').mockReturnValue([]);
      const error = { message: 'empty content in message' };
      const result = await handleSessionRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('handles empty_content error with thinking-only messages', async () => {
      vi.spyOn(storage, 'findMessagesWithEmptyTextParts').mockReturnValue([]);
      vi.spyOn(storage, 'findMessagesWithThinkingOnly').mockReturnValue(['msg_005']);
      vi.spyOn(storage, 'injectTextPart').mockReturnValue(true);
      vi.spyOn(storage, 'findEmptyMessages').mockReturnValue([]);
      const error = { message: 'empty content in message' };
      const result = await handleSessionRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('handles empty_content error with empty messages', async () => {
      vi.spyOn(storage, 'findMessagesWithEmptyTextParts').mockReturnValue([]);
      vi.spyOn(storage, 'findMessagesWithThinkingOnly').mockReturnValue([]);
      vi.spyOn(storage, 'findEmptyMessages').mockReturnValue(['msg_006']);
      vi.spyOn(storage, 'injectTextPart').mockReturnValue(true);
      const error = { message: 'empty content in message' };
      const result = await handleSessionRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('handles recovery failure with exception', async () => {
      vi.spyOn(storage, 'findMessagesWithOrphanThinking').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const error = { message: 'thinking must start with first block' };
      const result = await handleSessionRecovery('session-1', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(false);
    });
  });
});

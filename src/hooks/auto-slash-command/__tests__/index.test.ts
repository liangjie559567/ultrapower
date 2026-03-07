import { describe, it, expect } from 'vitest';
import { createAutoSlashCommandHook, processSlashCommand } from '../index.js';

describe('Auto Slash Command Hook', () => {
  describe('processMessage', () => {
    it('detects and processes slash command', () => {
      const hook = createAutoSlashCommandHook();
      const result = hook.processMessage(
        { sessionId: 'test-session', messageId: 'msg-1' },
        [{ type: 'text', text: '/test-command arg1 arg2' }]
      );

      expect(result.detected).toBe(true);
      expect(result.parsedCommand?.command).toBe('test-command');
      expect(result.parsedCommand?.args).toBe('arg1 arg2');
    });

    it('skips already processed messages', () => {
      const hook = createAutoSlashCommandHook();
      const parts = [{ type: 'text', text: '<auto-slash-command>\nContent\n</auto-slash-command>' }];

      const result = hook.processMessage({ sessionId: 'test', messageId: 'msg' }, parts);
      expect(result.detected).toBe(false);
    });

    it('returns false for non-slash-command text', () => {
      const hook = createAutoSlashCommandHook();
      const result = hook.processMessage(
        { sessionId: 'test', messageId: 'msg' },
        [{ type: 'text', text: 'regular text without command' }]
      );

      expect(result.detected).toBe(false);
    });
  });

  describe('session management', () => {
    it('prevents duplicate command processing', () => {
      const hook = createAutoSlashCommandHook();
      const input = { sessionId: 'session-1', messageId: 'msg-1' };
      const parts = [{ type: 'text', text: '/test-cmd' }];

      const first = hook.processMessage(input, parts);
      const second = hook.processMessage(input, parts);

      expect(first.detected).toBe(true);
      expect(second.detected).toBe(false);
    });

    it('clears session cache', () => {
      const hook = createAutoSlashCommandHook();
      hook.processMessage(
        { sessionId: 'session-1', messageId: 'msg-1' },
        [{ type: 'text', text: '/cmd' }]
      );

      hook.clearSession('session-1');

      const result = hook.processMessage(
        { sessionId: 'session-1', messageId: 'msg-1' },
        [{ type: 'text', text: '/cmd' }]
      );
      expect(result.detected).toBe(true);
    });
  });

  describe('utility function', () => {
    it('processes slash command via utility', () => {
      const result = processSlashCommand('/test-command args');
      expect(result.detected).toBe(true);
      expect(result.parsedCommand?.command).toBe('test-command');
    });
  });
});

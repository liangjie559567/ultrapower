import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeHookInput, SENSITIVE_HOOKS } from '../bridge-normalize.js';

describe('bridge-normalize', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('T2: permission-request error handling', () => {
    it('should throw error for sensitive hooks with invalid input', () => {
      const invalidInput = { unknown_field: 'invalid' };

      expect(() => {
        normalizeHookInput(invalidInput, 'permission-request');
      }).toThrow(/Missing required keys for permission-request/);
    });

    it('should log warning for non-sensitive hooks with invalid input', () => {
      // Use invalid type for a known field to trigger Zod validation failure
      const invalidInput = { tool_name: 123 };

      normalizeHookInput(invalidInput, 'tool-use');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[bridge-normalize] Zod validation failed')
      );
    });

    it('should allow unknown fields for non-sensitive hooks', () => {
      const input = {
        session_id: 'test-session',
        unknown_field: 'should-pass-through',
      };

      const result = normalizeHookInput(input, 'tool-use');

      expect(result.sessionId).toBe('test-session');
      expect((result as any).unknown_field).toBe('should-pass-through');
    });

    it('should allow known fields for sensitive hooks', () => {
      const input = {
        session_id: 'test-session',
        tool_name: 'test-tool',
        permission_mode: 'auto',
      };

      const result = normalizeHookInput(input, 'permission-request');

      expect(result.sessionId).toBe('test-session');
      expect(result.toolName).toBe('test-tool');
    });
  });

  describe('sensitive hooks classification', () => {
    it('should treat all SENSITIVE_HOOKS as sensitive', () => {
      // Only test hooks that have required keys defined
      const hooksWithRequiredKeys: HookType[] = ['permission-request'];

      for (const hookType of hooksWithRequiredKeys) {
        const invalidInput = { invalid: true };

        expect(() => {
          normalizeHookInput(invalidInput, hookType);
        }).toThrow(/Missing required keys/);
      }
    });

    it('should normalize snake_case to camelCase for sensitive hooks', () => {
      const input = {
        session_id: 'test-session',
        tool_name: 'test-tool',
      };

      const result = normalizeHookInput(input, 'permission-request');

      expect(result.sessionId).toBe('test-session');
      expect(result.toolName).toBe('test-tool');
      expect((result as any).session_id).toBeUndefined();
      expect((result as any).tool_name).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle null input', () => {
      const result = normalizeHookInput(null);
      expect(result).toEqual({});
    });

    it('should handle non-object input', () => {
      const result = normalizeHookInput('string');
      expect(result).toEqual({});
    });

    it('should use fast path for camelCase input', () => {
      const input = {
        sessionId: 'test-session',
        toolName: 'test-tool',
        directory: '/test/dir',
      };

      const result = normalizeHookInput(input, 'tool-use');

      expect(result.sessionId).toBe('test-session');
      expect(result.toolName).toBe('test-tool');
      expect(result.directory).toBe('/test/dir');
    });
  });

  describe('field mapping', () => {
    it('should map tool_name to toolName', () => {
      const result = normalizeHookInput({ tool_name: 'test-tool' });
      expect(result.toolName).toBe('test-tool');
    });

    it('should map tool_input to toolInput', () => {
      const input = { a: 1 };
      const result = normalizeHookInput({ tool_input: input });
      expect(result.toolInput).toEqual(input);
    });

    it('should map tool_response to toolOutput', () => {
      const output = { result: 'success' };
      const result = normalizeHookInput({ tool_response: output });
      expect(result.toolOutput).toEqual(output);
    });

    it('should map session_id to sessionId', () => {
      const result = normalizeHookInput({ session_id: 'test-123' });
      expect(result.sessionId).toBe('test-123');
    });

    it('should map cwd to directory', () => {
      const result = normalizeHookInput({ cwd: '/test/path' });
      expect(result.directory).toBe('/test/path');
    });

    it('should prefer snake_case over camelCase', () => {
      const result = normalizeHookInput({
        tool_name: 'snake',
        toolName: 'camel',
      });
      expect(result.toolName).toBe('snake');
    });
  });
});

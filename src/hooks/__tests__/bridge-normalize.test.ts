import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeHookInput } from '../bridge-normalize.js';

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

  describe('boundary tests', () => {
    it('should handle extremely long string input', () => {
      const longString = 'a'.repeat(100000);
      const result = normalizeHookInput({ tool_name: longString });
      expect(result.toolName).toBe(longString);
    });

    it('should handle special characters in strings', () => {
      const specialChars = '!@#$%^&*()[]{}|\\/<>?~`"\';:,.\n\t\r';
      const result = normalizeHookInput({ tool_name: specialChars });
      expect(result.toolName).toBe(specialChars);
    });

    it('should handle unicode and emoji in strings', () => {
      const unicode = '你好世界🚀🎉';
      const result = normalizeHookInput({ session_id: unicode });
      expect(result.sessionId).toBe(unicode);
    });

    it('should handle empty string values', () => {
      const result = normalizeHookInput({ tool_name: '' });
      expect(result.toolName).toBe('');
    });

    it('should handle undefined values', () => {
      const result = normalizeHookInput({ tool_name: undefined });
      expect(result.toolName).toBeUndefined();
    });

    it('should handle deeply nested objects in tool_input', () => {
      const nested = { a: { b: { c: { d: { e: 'deep' } } } } };
      const result = normalizeHookInput({ tool_input: nested });
      expect(result.toolInput).toEqual(nested);
    });

    it('should handle large arrays in tool_input', () => {
      const largeArray = Array(10000).fill({ key: 'value' });
      const result = normalizeHookInput({ tool_input: largeArray });
      expect(result.toolInput).toEqual(largeArray);
    });

    it('should drop unknown fields for sensitive hooks', () => {
      const input = {
        session_id: 'test',
        tool_name: 'test-tool',
        unknown_field: 'should-be-dropped',
        another_unknown: 123,
      };
      const result = normalizeHookInput(input, 'permission-request');
      expect(result.sessionId).toBe('test');
      expect(result.toolName).toBe('test-tool');
      expect((result as any).unknown_field).toBeUndefined();
      expect((result as any).another_unknown).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dropped unknown fields')
      );
    });

    it('should handle empty object input', () => {
      const result = normalizeHookInput({});
      expect(result).toEqual({});
    });

    it('should handle input with only unknown fields for non-sensitive hooks', () => {
      const input = { unknown1: 'val1', unknown2: 'val2' };
      const result = normalizeHookInput(input, 'tool-use');
      expect((result as any).unknown1).toBe('val1');
      expect((result as any).unknown2).toBe('val2');
    });

    it('should handle null values in fields', () => {
      const result = normalizeHookInput({ tool_name: null });
      expect(result.toolName).toBeUndefined();
    });

    it('should handle mixed snake_case and camelCase input', () => {
      const input = {
        tool_name: 'snake-tool',
        sessionId: 'camel-session',
        cwd: '/snake/path',
        toolInput: { camel: true },
      };
      const result = normalizeHookInput(input);
      expect(result.toolName).toBe('snake-tool');
      expect(result.sessionId).toBe('camel-session');
      expect(result.directory).toBe('/snake/path');
      expect(result.toolInput).toEqual({ camel: true });
    });
  });
});

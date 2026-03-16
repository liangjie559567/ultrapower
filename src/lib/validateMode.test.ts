import { describe, it, expect } from 'vitest';
import { assertValidMode, validateMode, VALID_MODES, type ValidMode } from './validateMode';

describe('validateMode', () => {
  it('should return true for all valid modes', () => {
    VALID_MODES.forEach(mode => {
      expect(validateMode(mode)).toBe(true);
    });
  });

  it('should return false for invalid modes', () => {
    expect(validateMode('invalid')).toBe(false);
    expect(validateMode('')).toBe(false);
    expect(validateMode('../')).toBe(false);
    expect(validateMode('autopilot/../etc')).toBe(false);
  });

  it('should return false for non-string inputs', () => {
    expect(validateMode(null)).toBe(false);
    expect(validateMode(undefined)).toBe(false);
    expect(validateMode(123)).toBe(false);
    expect(validateMode({})).toBe(false);
  });
});

describe('assertValidMode', () => {
  it('should return the mode for all valid modes', () => {
    VALID_MODES.forEach(mode => {
      expect(assertValidMode(mode)).toBe(mode);
    });
  });

  it('should throw for path traversal attempts with ../', () => {
    expect(() => assertValidMode('../')).toThrow('Path traversal attempt detected');
  });

  it('should throw for path traversal attempts with ..\\', () => {
    expect(() => assertValidMode('...\\')).toThrow('Path traversal attempt detected');
  });

  it('should throw for URL-encoded path traversal %2e%2e/', () => {
    expect(() => assertValidMode('%2e%2e/')).toThrow('Path traversal attempt detected');
  });

  it('should throw for complex path traversal autopilot/../etc', () => {
    expect(() => assertValidMode('autopilot/../etc')).toThrow('Path traversal attempt detected');
  });

  it('should throw for forward slash', () => {
    expect(() => assertValidMode('auto/pilot')).toThrow('Path traversal attempt detected');
  });

  it('should throw for backslash', () => {
    expect(() => assertValidMode('auto\\pilot')).toThrow('Path traversal attempt detected');
  });

  it('should throw for dot prefix', () => {
    expect(() => assertValidMode('.autopilot')).toThrow('Path traversal attempt detected');
  });

  it('should throw for Windows absolute path', () => {
    expect(() => assertValidMode('C:\\Windows')).toThrow('Path traversal attempt detected');
  });

  it('should throw for invalid mode without path traversal', () => {
    expect(() => assertValidMode('invalid')).toThrow('Invalid mode: "invalid"');
  });

  it('should throw for empty string', () => {
    expect(() => assertValidMode('')).toThrow('Invalid mode');
  });

  it('should throw for non-string inputs', () => {
    expect(() => assertValidMode(null)).toThrow('Invalid mode');
    expect(() => assertValidMode(undefined)).toThrow('Invalid mode');
    expect(() => assertValidMode(123)).toThrow('Invalid mode');
  });

  it('should throw for excessively long mode names', () => {
    const longMode = 'a'.repeat(101);
    expect(() => assertValidMode(longMode)).toThrow('Mode name too long');
  });
});

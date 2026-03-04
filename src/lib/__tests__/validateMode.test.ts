import { describe, it, expect } from 'vitest';
import { validateMode, assertValidMode, VALID_MODES } from '../validateMode.js';

describe('validateMode', () => {
  it('accepts all valid modes', () => {
    VALID_MODES.forEach(mode => {
      expect(validateMode(mode)).toBe(true);
    });
  });

  it('rejects invalid string modes', () => {
    expect(validateMode('invalid')).toBe(false);
    expect(validateMode('')).toBe(false);
    expect(validateMode('AUTOPILOT')).toBe(false);
  });

  it('rejects path traversal attempts', () => {
    expect(validateMode('../etc/passwd')).toBe(false);
    expect(validateMode('../../etc')).toBe(false);
    expect(validateMode('..\\windows')).toBe(false);
    expect(validateMode('./local')).toBe(false);
  });

  it('rejects absolute paths', () => {
    expect(validateMode('/etc/passwd')).toBe(false);
    expect(validateMode('C:\\Windows')).toBe(false);
    expect(validateMode('C:/Windows')).toBe(false);
  });

  it('rejects non-string types', () => {
    expect(validateMode(null)).toBe(false);
    expect(validateMode(undefined)).toBe(false);
    expect(validateMode(123)).toBe(false);
    expect(validateMode({})).toBe(false);
    expect(validateMode([])).toBe(false);
  });
});

describe('assertValidMode', () => {
  it('returns valid modes unchanged', () => {
    VALID_MODES.forEach(mode => {
      expect(assertValidMode(mode)).toBe(mode);
    });
  });

  it('throws on invalid modes', () => {
    expect(() => assertValidMode('invalid')).toThrow('Invalid mode');
    expect(() => assertValidMode('')).toThrow('Invalid mode');
  });

  it('throws on path traversal with specific error', () => {
    expect(() => assertValidMode('../etc')).toThrow('Path traversal attempt detected');
    expect(() => assertValidMode('../../passwd')).toThrow('Path traversal attempt detected');
    expect(() => assertValidMode('..\\windows')).toThrow('Path traversal attempt detected');
  });

  it('throws on absolute paths', () => {
    expect(() => assertValidMode('/etc/passwd')).toThrow('Path traversal attempt detected');
    expect(() => assertValidMode('C:\\Windows')).toThrow('Path traversal attempt detected');
  });

  it('truncates long inputs', () => {
    const longInput = 'a'.repeat(100);
    expect(() => assertValidMode(longInput)).toThrow('...(truncated)');
  });

  it('handles non-string types', () => {
    expect(() => assertValidMode(null)).toThrow('Invalid mode');
    expect(() => assertValidMode(123)).toThrow('Invalid mode');
  });
});

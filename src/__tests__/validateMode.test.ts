import { describe, it, expect } from 'vitest';
import { validateMode, assertValidMode, VALID_MODES } from '../lib/validateMode';

describe('validateMode', () => {
  it('should return true for all 8 valid modes', () => {
    const expected = ['autopilot', 'ultrapilot', 'team', 'pipeline', 'ralph', 'ultrawork', 'ultraqa', 'swarm'];
    expect(VALID_MODES).toHaveLength(8);
    for (const mode of expected) {
      expect(validateMode(mode)).toBe(true);
    }
  });

  it('should return false for unknown mode strings', () => {
    expect(validateMode('unknown')).toBe(false);
    expect(validateMode('auto')).toBe(false);
    expect(validateMode('AUTOPILOT')).toBe(false);
  });

  it('should return false for path traversal attempts', () => {
    expect(validateMode('../../etc/passwd')).toBe(false);
    expect(validateMode('../autopilot')).toBe(false);
    expect(validateMode('autopilot/../../../etc')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(validateMode('')).toBe(false);
  });

  it('should return false for non-string types', () => {
    expect(validateMode(null)).toBe(false);
    expect(validateMode(undefined)).toBe(false);
    expect(validateMode(42)).toBe(false);
    expect(validateMode({})).toBe(false);
    expect(validateMode([])).toBe(false);
    expect(validateMode(true)).toBe(false);
    expect(validateMode(Symbol('autopilot'))).toBe(false);
  });

  it('should return false for whitespace-only strings', () => {
    expect(validateMode(' ')).toBe(false);
    expect(validateMode('\t')).toBe(false);
    expect(validateMode('\n')).toBe(false);
    expect(validateMode('   ')).toBe(false);
  });

  it('should return false for null byte injection', () => {
    expect(validateMode('autopilot\x00')).toBe(false);
    expect(validateMode('autopilot\x00../../etc')).toBe(false);
  });

  it('should return false for prototype pollution vectors', () => {
    expect(validateMode('__proto__')).toBe(false);
    expect(validateMode('constructor')).toBe(false);
    expect(validateMode('prototype')).toBe(false);
  });

  it('should handle very long strings without throwing', () => {
    const longString = 'a'.repeat(1_000_000);
    expect(validateMode(longString)).toBe(false);
  });
});

describe('assertValidMode', () => {
  it('should return the mode string for valid modes', () => {
    expect(assertValidMode('autopilot')).toBe('autopilot');
    expect(assertValidMode('swarm')).toBe('swarm');
    expect(assertValidMode('ralph')).toBe('ralph');
  });

  it('should throw for invalid mode strings', () => {
    expect(() => assertValidMode('unknown')).toThrow('Invalid mode');
    expect(() => assertValidMode('../../etc')).toThrow('Invalid mode');
  });

  it('should throw for non-string input', () => {
    expect(() => assertValidMode(null)).toThrow('Invalid mode');
    expect(() => assertValidMode(undefined)).toThrow('Invalid mode');
  });

  it('error message should list valid modes', () => {
    expect(() => assertValidMode('bad')).toThrow('autopilot');
  });

  it('error message should truncate very long input to prevent DoS', () => {
    const longInput = 'x'.repeat(1_000_000);
    let errorMessage = '';
    try {
      assertValidMode(longInput);
    } catch (e) {
      errorMessage = (e as Error).message;
    }
    expect(errorMessage.length).toBeLessThan(500);
    expect(errorMessage).toContain('truncated');
  });

  it('error message should not expose raw non-string input verbatim', () => {
    const obj = { secret: 'password123' };
    let errorMessage = '';
    try {
      assertValidMode(obj);
    } catch (e) {
      errorMessage = (e as Error).message;
    }
    expect(errorMessage).not.toContain('password123');
  });

  it('returned value should be usable in path construction without traversal risk', () => {
    const mode = assertValidMode('autopilot');
    const path = `.omc/state/${mode}-state.json`;
    expect(path).toBe('.omc/state/autopilot-state.json');
    expect(path).not.toContain('..');
  });
});

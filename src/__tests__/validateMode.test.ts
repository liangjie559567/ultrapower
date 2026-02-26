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

  it('returned value should be usable in path construction without traversal risk', () => {
    const mode = assertValidMode('autopilot');
    const path = `.omc/state/${mode}-state.json`;
    expect(path).toBe('.omc/state/autopilot-state.json');
    expect(path).not.toContain('..');
  });
});

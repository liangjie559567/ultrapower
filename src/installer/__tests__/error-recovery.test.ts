/**
 * Tests for error recovery and edge cases
 */

import { describe, it, expect } from 'vitest';
import { checkNodeVersion, isHudEnabledInConfig, isOmcStatusLine } from '../index.js';
import { isWindows, shouldUseNodeHooks, getClaudeConfigDir, getHooksDir } from '../hooks.js';

describe('error recovery', () => {
  it('checkNodeVersion handles current version correctly', () => {
    const result = checkNodeVersion();
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('current');
    expect(result).toHaveProperty('required');
    expect(typeof result.valid).toBe('boolean');
    expect(typeof result.current).toBe('number');
    expect(result.required).toBe(20);
  });

  it('isHudEnabledInConfig returns boolean', () => {
    const result = isHudEnabledInConfig();
    expect(typeof result).toBe('boolean');
  });

  it('isOmcStatusLine handles edge cases', () => {
    expect(isOmcStatusLine(null)).toBe(false);
    expect(isOmcStatusLine(undefined)).toBe(false);
    expect(isOmcStatusLine({})).toBe(false);
    expect(isOmcStatusLine({ command: 123 })).toBe(false);
    expect(isOmcStatusLine({ type: 'command', command: 'omc-hud' })).toBe(true);
  });
});

describe('hooks utilities', () => {
  it('isWindows returns boolean', () => {
    const result = isWindows();
    expect(typeof result).toBe('boolean');
  });

  it('shouldUseNodeHooks always returns true', () => {
    expect(shouldUseNodeHooks()).toBe(true);
  });

  it('getClaudeConfigDir returns string path', () => {
    const result = getClaudeConfigDir();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('getHooksDir returns string path', () => {
    const result = getHooksDir();
    expect(typeof result).toBe('string');
    expect(result).toContain('hooks');
  });
});

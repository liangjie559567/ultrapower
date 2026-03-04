import { describe, it, expect } from 'vitest';
import { nonInteractiveEnvHook, NON_INTERACTIVE_ENV } from '../index.js';

describe('non-interactive-env hook', () => {
  it('should have hook name', () => {
    expect(nonInteractiveEnvHook.name).toBe('non-interactive-env');
  });

  it('should process command', async () => {
    const result = await nonInteractiveEnvHook.beforeCommand('echo test');
    expect(result.command).toBeDefined();
  });

  it('should have env variables', () => {
    expect(NON_INTERACTIVE_ENV).toBeDefined();
    expect(typeof NON_INTERACTIVE_ENV).toBe('object');
  });
});

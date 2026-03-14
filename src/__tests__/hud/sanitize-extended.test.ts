import { describe, it, expect } from 'vitest';
import { sanitizeOutput } from '../../hud/sanitize.js';

describe('Sanitize Output', () => {
  it('handles empty string', () => {
    expect(sanitizeOutput('')).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizeOutput('Hello World')).toBe('Hello World');
  });
});

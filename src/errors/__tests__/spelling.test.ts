import { describe, it, expect } from 'vitest';
import { suggestSpellingCorrection } from '../spelling.js';

describe('suggestSpellingCorrection', () => {
  const commands = ['init', 'setup', 'run', 'config', 'help'];

  it('suggests correct command for typo', () => {
    expect(suggestSpellingCorrection('initt', commands)).toBe('init');
    expect(suggestSpellingCorrection('setp', commands)).toBe('setup');
    expect(suggestSpellingCorrection('hlep', commands)).toBe('help');
  });

  it('returns null for distant matches', () => {
    expect(suggestSpellingCorrection('xyz', commands)).toBeNull();
  });

  it('handles case insensitivity', () => {
    expect(suggestSpellingCorrection('INIT', commands)).toBe('init');
  });
});

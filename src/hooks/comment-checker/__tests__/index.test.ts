import { describe, it, expect } from 'vitest';
import { applyFilters } from '../filters.js';
import { EXTENSION_TO_LANGUAGE } from '../constants.js';

describe('comment-checker hook', () => {
  it('should apply filters', () => {
    const comments = [{ line: 1, text: '// TODO: test', type: 'line' as const }];
    const filtered = applyFilters(comments);
    expect(Array.isArray(filtered)).toBe(true);
  });

  it('should map extensions to languages', () => {
    expect(EXTENSION_TO_LANGUAGE['.ts']).toBe('ts');
    expect(EXTENSION_TO_LANGUAGE['.js']).toBe('js');
  });

  it('should handle empty comments', () => {
    const filtered = applyFilters([]);
    expect(filtered).toEqual([]);
  });
});

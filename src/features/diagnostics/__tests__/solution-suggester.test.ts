import { describe, it, expect } from 'vitest';
import { SolutionSuggester } from '../solution-suggester';

describe('SolutionSuggester', () => {
  const suggester = new SolutionSuggester();

  it('should suggest solution for TypeScript errors', () => {
    const result = suggester.suggest('TS2339: Property does not exist');
    expect(result?.category).toBe('typescript');
    expect(result?.steps.length).toBeGreaterThan(0);
  });

  it('should suggest solution for file errors', () => {
    const result = suggester.suggest('ENOENT: no such file');
    expect(result?.category).toBe('filesystem');
    expect(result?.steps).toContain('Verify file path');
  });

  it('should suggest solution for permission errors', () => {
    const result = suggester.suggest('EACCES: permission denied');
    expect(result?.category).toBe('permissions');
    expect(result?.steps.length).toBeGreaterThan(0);
  });

  it('should return null for unknown errors', () => {
    const result = suggester.suggest('Unknown error');
    expect(result).toBeNull();
  });
});

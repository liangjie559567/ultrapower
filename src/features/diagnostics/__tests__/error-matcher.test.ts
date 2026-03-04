import { describe, it, expect } from 'vitest';
import { ErrorMatcher } from '../error-matcher';

describe('ErrorMatcher', () => {
  const matcher = new ErrorMatcher();

  it('should match TypeScript errors', () => {
    const result = matcher.match('TS2339: Property does not exist');
    expect(result?.category).toBe('typescript');
  });

  it('should match file not found errors', () => {
    const result = matcher.match('ENOENT: no such file');
    expect(result?.category).toBe('filesystem');
  });

  it('should match permission errors', () => {
    const result = matcher.match('EACCES: permission denied');
    expect(result?.category).toBe('permissions');
  });

  it('should match hook timeout errors', () => {
    const result = matcher.match('Hook execution timeout exceeded');
    expect(result?.category).toBe('hook');
  });

  it('should match memory errors', () => {
    const result = matcher.match('JavaScript heap out of memory');
    expect(result?.category).toBe('memory');
  });

  it('should return null for unknown errors', () => {
    const result = matcher.match('Unknown error');
    expect(result).toBeNull();
  });

  it('should match all applicable patterns', () => {
    const results = matcher.matchAll('TS2339 and timeout');
    expect(results.length).toBeGreaterThan(0);
  });
});

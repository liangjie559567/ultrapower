import { describe, it, expect } from 'vitest';
import { getAllKeywords, getPrimaryKeyword } from '../../src/hooks/keyword-detector/index';

describe('BUG-005 关键词冲突', () => {
  it('should prioritize cancel over all other keywords', () => {
    const result = getAllKeywords('cancelomc ralph ultrawork');
    expect(result).toEqual(['cancel']);
  });

  it('should prioritize team over autopilot', () => {
    const result = getAllKeywords('team autopilot');
    expect(result).not.toContain('autopilot');
    expect(result).toContain('team');
  });

  it('should handle ralph + ultrawork combination', () => {
    const result = getAllKeywords('ralph ultrawork');
    expect(result).toContain('ralph');
    expect(result).toContain('ultrawork');
  });

  it('should return primary keyword with highest priority', () => {
    const result = getPrimaryKeyword('plan ultrawork ralph');
    expect(result?.type).toBe('ralph');
  });

  it('should handle 3-keyword combination with priority order', () => {
    const result = getAllKeywords('autopilot ultrawork plan');
    expect(result[0]).toBe('autopilot');
  });
});

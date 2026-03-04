import { describe, it, expect } from 'vitest';
import { estimateTokens, analyzeContextUsage } from '../index.js';

describe('preemptive-compaction hook', () => {
  it('should estimate tokens from text', () => {
    const tokens = estimateTokens('Hello world');
    expect(tokens).toBeGreaterThan(0);
  });

  it('should analyze context usage below threshold', () => {
    const result = analyzeContextUsage('Short text');
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.action).toBe('none');
  });

  it('should detect warning threshold', () => {
    const longText = 'x'.repeat(680000);
    const result = analyzeContextUsage(longText);
    expect(result.isWarning).toBe(true);
  });
});

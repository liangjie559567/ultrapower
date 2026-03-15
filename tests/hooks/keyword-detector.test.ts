import { describe, it, expect } from 'vitest';
import { sanitizeForKeywordDetection } from '../../src/hooks/keyword-detector/index';

describe('Keyword Detector - BUG-003 ReDoS', () => {
  it('should handle 10000 character input within 100ms', () => {
    const longText = 'a'.repeat(10000);
    const start = Date.now();
    const result = sanitizeForKeywordDetection(longText);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    expect(result.length).toBeLessThanOrEqual(10000);
  });

  it('should truncate input exceeding 50KB', () => {
    const hugeText = 'x'.repeat(60000);
    const result = sanitizeForKeywordDetection(hugeText);
    expect(result.length).toBeLessThanOrEqual(50000);
  });

  it('should handle deeply nested XML without timeout', () => {
    const depth = 1000;
    const nested = '<tag>'.repeat(depth) + 'content' + '</tag>'.repeat(depth);

    const start = Date.now();
    const result = sanitizeForKeywordDetection(nested);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    expect(result).toBeTruthy();
  });
});

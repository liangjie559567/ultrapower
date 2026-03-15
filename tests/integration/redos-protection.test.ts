import { describe, it, expect } from 'vitest';
import { sanitizeForKeywordDetection } from '../../src/hooks/keyword-detector/index';

describe('Integration: ReDoS Protection (BUG-003)', () => {
  it('should handle nested depth 1-10000 within performance threshold', () => {
    const depths = [1, 10, 100, 1000, 5000, 10000];

    for (const depth of depths) {
      const nested = '('.repeat(depth) + 'content' + ')'.repeat(depth);
      const start = Date.now();
      const result = sanitizeForKeywordDetection(nested);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    }
  });

  it('should process 10000 characters under 100ms', () => {
    const input = 'a'.repeat(10000);
    const start = Date.now();
    sanitizeForKeywordDetection(input);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should enforce 50KB input limit', () => {
    const oversized = 'x'.repeat(60000);
    const result = sanitizeForKeywordDetection(oversized);
    expect(result.length).toBeLessThanOrEqual(50000);
  });
});

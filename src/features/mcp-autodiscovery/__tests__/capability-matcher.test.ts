import { describe, it, expect } from 'vitest';
import { CapabilityMatcher } from '../capability-matcher';

describe('CapabilityMatcher', () => {
  it('should return empty array when no matches found', async () => {
    const matcher = new CapabilityMatcher();
    const matches = await matcher.findMatches({
      taskDescription: 'nonexistent capability',
      requiredCapabilities: ['xyz-nonexistent-capability-12345']
    });

    expect(matches).toBeInstanceOf(Array);
    expect(matches.length).toBe(0);
  }, 60000);

  it('should rank matches by confidence', async () => {
    const matcher = new CapabilityMatcher();
    const matches = await matcher.findMatches({
      taskDescription: 'fetch web content',
      requiredCapabilities: ['web']
    });

    for (let i = 1; i < matches.length; i++) {
      expect(matches[i-1].confidence).toBeGreaterThanOrEqual(matches[i].confidence);
    }
  }, 60000);
});

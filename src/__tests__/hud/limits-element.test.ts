import { describe, it, expect } from 'vitest';
import { renderRateLimits } from '../../hud/elements/limits.js';

describe('Limits Element', () => {
  it('renders rate limit info', () => {
    const result = renderRateLimits({ fiveHourPercent: 45, weeklyPercent: 30 });
    expect(result).toBeTruthy();
  });

  it('returns null for null limits', () => {
    expect(renderRateLimits(null)).toBeNull();
  });
});

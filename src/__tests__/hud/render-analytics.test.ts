import { describe, it, expect } from 'vitest';
import { getSessionHealthAnalyticsData } from '../../hud/analytics-display.js';
import type { SessionHealth } from '../../hud/types.js';

describe('Render Analytics', () => {
  const mockHealth: SessionHealth = {
    totalCost: 1.5,
    totalTokens: 50000,
    cacheHitRate: 0.75,
    sessionDuration: 3600000,
    status: 'healthy'
  };

  it('returns analytics data', () => {
    const result = getSessionHealthAnalyticsData(mockHealth);
    expect(result).toHaveProperty('cost');
    expect(result).toHaveProperty('tokens');
  });
});

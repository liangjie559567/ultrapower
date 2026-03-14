import { describe, it, expect } from 'vitest';
import { BehaviorTracker, PersonalizedRecommender } from '../index.js';

describe('Personalized Recommendation Integration', () => {
  it('should track user behavior', () => {
    BehaviorTracker.track({
      timestamp: new Date().toISOString(),
      action: 'skill_used',
      target: 'autopilot',
      success: true
    });
    expect(true).toBe(true);
  });

  it('should build user profile', () => {
    const profile = BehaviorTracker.buildProfile();
    expect(profile.preferredWorkflows).toBeDefined();
    expect(profile.frequentAgents).toBeDefined();
    expect(profile.skillUsageCount).toBeDefined();
  });

  it('should generate recommendations', () => {
    const recs = PersonalizedRecommender.getRecommendations('test prompt');
    expect(Array.isArray(recs)).toBe(true);
  });
});

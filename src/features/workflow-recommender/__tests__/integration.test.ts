import { describe, it, expect } from 'vitest';
import { autoSelectWorkflow } from '../auto-selector.js';
import { formatRecommendation } from '../executor.js';

describe('Workflow Recommender Integration', () => {
  it('should auto-select workflow with high confidence', async () => {
    const result = await autoSelectWorkflow('fix the login bug in auth module');
    expect(result.shouldAuto).toBeDefined();
    expect(result.reason).toBeDefined();
  });

  it('should format recommendation correctly', () => {
    const rec = {
      workflow: 'autopilot',
      confidence: 0.9,
      reason: '测试',
      alternatives: ['ralph', 'ultrawork']
    };
    const formatted = formatRecommendation(rec);
    expect(formatted).toContain('autopilot');
    expect(formatted).toContain('90%');
  });

  it('should handle missing alternatives', () => {
    const rec = {
      workflow: 'autopilot',
      confidence: 0.9,
      reason: '测试'
    };
    const formatted = formatRecommendation(rec);
    expect(formatted).toContain('无');
  });
});

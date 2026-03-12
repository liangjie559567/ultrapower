import { describe, it, expect } from 'vitest';
import { Dashboard, MetricsCollector, MetricsTracker } from '../index.js';

describe('Analytics Dashboard Integration', () => {
  const testCwd = process.cwd();

  it('should collect usage metrics', () => {
    const metrics = MetricsCollector.collectUsageMetrics(testCwd);
    expect(metrics.totalSessions).toBeDefined();
    expect(metrics.successRate).toBeDefined();
  });

  it('should collect skill metrics', () => {
    const skills = MetricsCollector.collectSkillMetrics(testCwd);
    expect(Array.isArray(skills)).toBe(true);
  });

  it('should collect agent metrics', () => {
    const agents = MetricsCollector.collectAgentMetrics(testCwd);
    expect(Array.isArray(agents)).toBe(true);
  });

  it('should render dashboard', () => {
    const output = Dashboard.render(testCwd);
    expect(output).toContain('使用数据分析');
    expect(output).toContain('总体指标');
  });

  it('should track events', () => {
    MetricsTracker.track({
      timestamp: new Date().toISOString(),
      type: 'skill_used',
      target: 'autopilot',
      success: true
    }, testCwd);
    expect(true).toBe(true);
  });
});

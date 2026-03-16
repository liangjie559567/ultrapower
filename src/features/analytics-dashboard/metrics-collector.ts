import type { UsageMetrics, SkillMetrics, AgentMetrics } from './types.js';
import { MetricsStorage } from './storage.js';

export class MetricsCollector {
  static collectUsageMetrics(cwd: string): UsageMetrics {
    const data = MetricsStorage.load(cwd);
    const successCount = [...data.skills, ...data.agents].filter((e) => e.success).length;
    const totalCount = data.skills.length + data.agents.length;

    return {
      totalSessions: data.sessions.length,
      totalSkillsUsed: data.skills.length,
      totalAgentsCalled: data.agents.length,
      averageSessionDuration: 0,
      successRate: totalCount > 0 ? successCount / totalCount : 0
    };
  }

  static collectSkillMetrics(cwd: string): SkillMetrics[] {
    const data = MetricsStorage.load(cwd);
    const skillMap = new Map<string, { total: number; success: number; durations: number[] }>();

    for (const event of data.skills) {
      const stats = skillMap.get(event.target) || { total: 0, success: 0, durations: [] };
      stats.total++;
      if (event.success) stats.success++;
      if (event.duration) stats.durations.push(event.duration);
      skillMap.set(event.target, stats);
    }

    return Array.from(skillMap.entries()).map(([name, stats]) => ({
      name,
      usageCount: stats.total,
      successCount: stats.success,
      averageDuration: stats.durations.length > 0
        ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        : 0
    }));
  }

  static collectAgentMetrics(cwd: string): AgentMetrics[] {
    const data = MetricsStorage.load(cwd);
    const agentMap = new Map<string, { total: number; success: number; times: number[] }>();

    for (const event of data.agents) {
      const stats = agentMap.get(event.target) || { total: 0, success: 0, times: [] };
      stats.total++;
      if (event.success) stats.success++;
      if (event.duration) stats.times.push(event.duration);
      agentMap.set(event.target, stats);
    }

    return Array.from(agentMap.entries()).map(([name, stats]) => ({
      name,
      callCount: stats.total,
      successRate: stats.total > 0 ? stats.success / stats.total : 0,
      averageResponseTime: stats.times.length > 0
        ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length
        : 0
    }));
  }
}

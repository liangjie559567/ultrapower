import { MetricsCollector } from './metrics-collector.js';
export class Dashboard {
    static render(cwd) {
        const usage = MetricsCollector.collectUsageMetrics(cwd);
        const skills = MetricsCollector.collectSkillMetrics(cwd);
        const agents = MetricsCollector.collectAgentMetrics(cwd);
        return `
📊 使用数据分析

总体指标：
  会话数：${usage.totalSessions}
  Skills使用：${usage.totalSkillsUsed}
  Agents调用：${usage.totalAgentsCalled}
  成功率：${(usage.successRate * 100).toFixed(1)}%

Top Skills：
${skills.slice(0, 5).map(s => `  ${s.name}: ${s.usageCount}次 (成功率${(s.successCount / s.usageCount * 100).toFixed(0)}%)`).join('\n') || '  暂无数据'}

Top Agents：
${agents.slice(0, 5).map(a => `  ${a.name}: ${a.callCount}次 (成功率${(a.successRate * 100).toFixed(0)}%)`).join('\n') || '  暂无数据'}
`;
    }
}
//# sourceMappingURL=dashboard.js.map
import type { UsageMetrics, SkillMetrics, AgentMetrics } from './types.js';
export declare class MetricsCollector {
    static collectUsageMetrics(cwd: string): UsageMetrics;
    static collectSkillMetrics(cwd: string): SkillMetrics[];
    static collectAgentMetrics(cwd: string): AgentMetrics[];
}
//# sourceMappingURL=metrics-collector.d.ts.map
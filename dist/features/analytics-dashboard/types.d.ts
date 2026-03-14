export interface UsageMetrics {
    totalSessions: number;
    totalSkillsUsed: number;
    totalAgentsCalled: number;
    averageSessionDuration: number;
    successRate: number;
}
export interface SkillMetrics {
    name: string;
    usageCount: number;
    successCount: number;
    averageDuration: number;
}
export interface AgentMetrics {
    name: string;
    callCount: number;
    successRate: number;
    averageResponseTime: number;
}
//# sourceMappingURL=types.d.ts.map
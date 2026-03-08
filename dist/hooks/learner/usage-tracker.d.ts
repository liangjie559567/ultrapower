/**
 * Usage Tracker
 *
 * Tracks agent/skill usage counts and persists metrics to
 * .omc/axiom/evolution/usage_metrics.json
 */
export interface UsageEvent {
    toolName: string;
    agentRole?: string;
    skillName?: string;
    timestamp: number;
    sessionId: string;
}
export interface AgentStats {
    totalCalls: number;
    lastUsed: string;
    sessions: string[];
}
export interface ToolStats {
    totalCalls: number;
    lastUsed: string;
}
export interface UsageMetrics {
    version: 1;
    lastUpdated: string;
    agents: Record<string, AgentStats>;
    skills: Record<string, AgentStats>;
    tools: Record<string, ToolStats>;
}
/**
 * Extract agent role from tool input.
 * Strips the "ultrapower:" prefix if present.
 */
export declare function extractAgentRole(_toolName: string, toolInput: unknown): string | undefined;
/**
 * Extract skill name from tool input.
 * Only applies when toolName === 'Task' and toolInput.skill is present.
 */
export declare function extractSkillName(toolName: string, toolInput: unknown): string | undefined;
/**
 * Record a usage event to disk.
 * Silently swallows all errors.
 */
export declare function recordUsage(directory: string, event: UsageEvent): Promise<void>;
//# sourceMappingURL=usage-tracker.d.ts.map
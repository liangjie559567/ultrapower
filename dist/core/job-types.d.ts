/**
 * Shared job types for MCP providers
 * Extracted to break circular dependencies
 */
export interface JobStatus {
    provider: 'codex' | 'gemini';
    jobId: string;
    slug: string;
    status: 'spawned' | 'running' | 'completed' | 'failed' | 'timeout';
    pid?: number;
    promptFile: string;
    responseFile: string;
    model: string;
    agentRole: string;
    spawnedAt: string;
    completedAt?: string;
    error?: string;
    usedFallback?: boolean;
    fallbackModel?: string;
    killedByUser?: boolean;
}
//# sourceMappingURL=job-types.d.ts.map
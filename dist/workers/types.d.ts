/**
 * Worker State Types - Unified state model for MCP and Team workers
 */
export type WorkerStatus = 'spawned' | 'running' | 'idle' | 'working' | 'completed' | 'failed' | 'timeout' | 'dead';
export interface WorkerState {
    workerId: string;
    workerType: 'mcp' | 'team';
    name: string;
    status: WorkerStatus;
    pid?: number;
    spawnedAt: string;
    lastHeartbeatAt?: string;
    completedAt?: string;
    provider?: 'codex' | 'gemini';
    model?: string;
    agentRole?: string;
    promptFile?: string;
    responseFile?: string;
    teamName?: string;
    tmuxSession?: string;
    currentTaskId?: string;
    consecutiveErrors?: number;
    error?: string;
    metadata?: Record<string, unknown>;
}
export interface HealthStatus {
    isAlive: boolean;
    heartbeatAge?: number;
    tmuxSessionAlive?: boolean;
    lastError?: string;
    uptimeMs?: number;
}
export interface WorkerFilter {
    workerType?: 'mcp' | 'team';
    status?: WorkerStatus | WorkerStatus[];
    teamName?: string;
    provider?: 'codex' | 'gemini';
    spawnedAfter?: Date;
    spawnedBefore?: Date;
}
//# sourceMappingURL=types.d.ts.map
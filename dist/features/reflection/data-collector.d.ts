export interface SessionData {
    sessionId: string;
    taskStatus: string;
    currentPhase: string;
    completedTasks: number;
    failedTasks: number;
    blockedTasks: number;
    totalTime?: string;
    agents?: string[];
}
export declare function collectSessionData(directory: string): SessionData | null;
//# sourceMappingURL=data-collector.d.ts.map
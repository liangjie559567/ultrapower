interface ModeProgress {
    active: boolean;
    phase: string;
    progress: number;
    tasksTotal: number;
    tasksCompleted: number;
    startedAt: string;
    lastHeartbeat: string;
}
interface UnifiedProgress {
    currentMode: string | null;
    modes: Record<string, ModeProgress>;
    linkedModes: {
        primary: string;
        secondary: string[];
    } | null;
    lastUpdated: string;
}
export declare function getProgress(directory: string): Promise<UnifiedProgress>;
export declare function syncAllStates(directory: string): Promise<void>;
export {};
//# sourceMappingURL=progress-tracker.d.ts.map
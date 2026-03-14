export interface SessionEvent {
    timestamp: string;
    type: 'session_start' | 'skill_used' | 'agent_called';
    target?: string;
    success?: boolean;
    duration?: number;
}
export declare class MetricsTracker {
    static track(event: SessionEvent, cwd: string): void;
}
//# sourceMappingURL=tracker.d.ts.map
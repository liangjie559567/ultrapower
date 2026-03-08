/**
 * Shared types for session-end hook
 * Extracted to break circular dependency between index.ts and callbacks.ts
 */
export interface SessionEndInput {
    session_id: string;
    transcript_path: string;
    cwd: string;
    permission_mode: string;
    hook_event_name: 'SessionEnd';
    reason: 'clear' | 'logout' | 'prompt_input_exit' | 'other';
}
export interface SessionMetrics {
    session_id: string;
    started_at?: string;
    ended_at: string;
    reason: string;
    duration_ms?: number;
    agents_spawned: number;
    agents_completed: number;
    modes_used: string[];
}
export interface HookOutput {
    continue: boolean;
}
//# sourceMappingURL=types.d.ts.map
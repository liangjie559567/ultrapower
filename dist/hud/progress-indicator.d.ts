/**
 * HUD Progress Indicator
 *
 * Real-time progress display for Team/Pipeline execution modes.
 * Format: [MODE] Phase (X/Y tasks) [████░░] 60% ✓⚠✗⟳
 */
interface ProgressData {
    mode: string;
    phase: string;
    completed: number;
    total: number;
    percentage: number;
    statusCounts: {
        success: number;
        warning: number;
        error: number;
        running: number;
    };
}
/**
 * Aggregate progress from state and tasks
 */
export declare function aggregateProgress(cwd: string): ProgressData | null;
/**
 * Format progress indicator line
 */
export declare function formatProgress(data: ProgressData): string;
/**
 * Get progress indicator string (main entry point)
 */
export declare function getProgressIndicator(cwd: string): string | null;
export {};
//# sourceMappingURL=progress-indicator.d.ts.map
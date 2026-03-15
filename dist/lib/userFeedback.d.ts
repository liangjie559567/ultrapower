/**
 * User Feedback Module
 *
 * Provides user-facing feedback mechanisms for progress, errors, and conflicts.
 */
export type FeedbackType = 'progress' | 'error' | 'conflict';
export interface ProgressFeedback {
    message: string;
    current: number;
    total: number;
}
export interface ErrorFeedback {
    message: string;
    recoverable: boolean;
}
export interface ConflictFeedback {
    detected: string[];
    selected: string;
}
export declare function showProgress(message: string, current: number, total: number): void;
export declare function showError(message: string, recoverable: boolean): void;
export declare function showConflict(detected: string[], selected: string): void;
//# sourceMappingURL=userFeedback.d.ts.map
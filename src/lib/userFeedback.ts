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

export function showProgress(message: string, current: number, total: number): void {
  console.log(`[Progress] ${message} (${current}/${total})`);
}

export function showError(message: string, recoverable: boolean): void {
  const prefix = recoverable ? '[Recoverable Error]' : '[Fatal Error]';
  console.error(`${prefix} ${message}`);
}

export function showConflict(detected: string[], selected: string): void {
  console.warn(`[Conflict] Detected: ${detected.join(', ')} | Selected: ${selected}`);
}

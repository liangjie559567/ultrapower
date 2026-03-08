/**
 * Persistent Mode Hook
 *
 * Unified handler for persistent work modes: ultrawork, ralph, and todo-continuation.
 * This hook intercepts Stop events and enforces work continuation based on:
 * 1. Active ultrawork mode with pending todos
 * 2. Active ralph loop (until cancelled via /ultrapower:cancel)
 * 3. Any pending todos (general enforcement)
 *
 * Priority order: Ralph > Ultrawork > Todo Continuation
 */
import { StopContext } from '../todo-continuation/index.js';
import { type ToolErrorState } from './tool-error.js';
export interface PersistentModeResult {
    /** Whether to block the stop event */
    shouldBlock: boolean;
    /** Message to inject into context */
    message: string;
    /** Which mode triggered the block */
    mode: 'ralph' | 'ultrawork' | 'todo-continuation' | 'autopilot' | 'none';
    /** Additional metadata */
    metadata?: {
        todoCount?: number;
        iteration?: number;
        maxIterations?: number;
        reinforcementCount?: number;
        todoContinuationAttempts?: number;
        phase?: string;
        tasksCompleted?: number;
        tasksTotal?: number;
        toolError?: ToolErrorState;
    };
}
/**
 * Reset todo-continuation attempt counter (call when todos actually change)
 */
export declare function resetTodoContinuationAttempts(sessionId: string): void;
/**
 * Main persistent mode checker
 * Checks all persistent modes in priority order and returns appropriate action
 */
export declare function checkPersistentModes(sessionId?: string, directory?: string, stopContext?: StopContext): Promise<PersistentModeResult>;
/**
 * Create hook output for Claude Code
 * NOTE: Always returns continue: true with soft enforcement via message injection.
 * Never returns continue: false to avoid blocking user intent.
 */
export declare function createHookOutput(result: PersistentModeResult): {
    continue: boolean;
    message?: string;
};
export { readLastToolError, clearToolErrorState, getToolErrorRetryGuidance, type ToolErrorState } from './tool-error.js';
//# sourceMappingURL=index.d.ts.map
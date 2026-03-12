/**
 * Error classification logic
 */
import { ErrorCategory, type FriendlyError } from './types.js';
export declare function classifyError(error: Error | string): ErrorCategory;
export declare function createFriendlyError(error: Error | string, context?: {
    command?: string;
    availableCommands?: string[];
}): FriendlyError;
//# sourceMappingURL=classifier.d.ts.map
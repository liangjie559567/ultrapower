/**
 * CLI error handler with friendly messages
 */
import type { ErrorContext } from '../errors/types.js';
export declare function handleCLIError(error: Error | string, context?: ErrorContext): void;
export declare function formatErrorForLog(error: Error | string): string;
//# sourceMappingURL=error-handler.d.ts.map
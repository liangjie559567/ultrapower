/**
 * Error classification and types
 */
export declare enum ErrorCategory {
    USER_INPUT = "user_input",
    SYSTEM = "system",
    NETWORK = "network",
    PERMISSION = "permission",
    NOT_FOUND = "not_found",
    VALIDATION = "validation"
}
export interface FriendlyError {
    category: ErrorCategory;
    message: string;
    technicalDetails?: string;
    recoverySteps: string[];
    suggestedCommand?: string;
}
export interface ErrorContext {
    command?: string;
    args?: string[];
    cwd?: string;
    [key: string]: unknown;
}
//# sourceMappingURL=types.d.ts.map
/**
 * Error classification logic
 */
import { ErrorCategory } from './types.js';
import { suggestSpellingCorrection } from './spelling.js';
const ERROR_PATTERNS = {
    [ErrorCategory.NOT_FOUND]: [
        /enoent/i,
        /not found/i,
        /no such file/i,
        /cannot find/i,
    ],
    [ErrorCategory.PERMISSION]: [
        /eacces/i,
        /eperm/i,
        /permission denied/i,
        /access denied/i,
    ],
    [ErrorCategory.NETWORK]: [
        /econnrefused/i,
        /etimedout/i,
        /network error/i,
        /fetch failed/i,
    ],
    [ErrorCategory.USER_INPUT]: [
        /unknown command/i,
        /invalid argument/i,
        /unexpected argument/i,
        /missing required/i,
    ],
    [ErrorCategory.VALIDATION]: [
        /invalid/i,
        /validation failed/i,
        /schema error/i,
    ],
    [ErrorCategory.SYSTEM]: [
        /cannot find module/i,
    ],
};
export function classifyError(error) {
    const message = typeof error === 'string' ? error : error.message;
    for (const [category, patterns] of Object.entries(ERROR_PATTERNS)) {
        if (patterns.some(p => p.test(message))) {
            return category;
        }
    }
    return ErrorCategory.SYSTEM;
}
export function createFriendlyError(error, context) {
    const message = typeof error === 'string' ? error : error.message;
    const category = classifyError(error);
    const base = {
        category,
        message: '',
        technicalDetails: message,
        recoverySteps: [],
    };
    switch (category) {
        case ErrorCategory.USER_INPUT:
            if (context?.command && context?.availableCommands) {
                const suggestion = suggestSpellingCorrection(context.command, context.availableCommands);
                base.message = `Unknown command: ${context.command}`;
                base.recoverySteps = [
                    'Check the command spelling',
                    'Run "omc --help" to see available commands',
                ];
                if (suggestion) {
                    base.suggestedCommand = suggestion;
                    base.recoverySteps.unshift(`Did you mean: ${suggestion}?`);
                }
            }
            else {
                base.message = 'Invalid input provided';
                base.recoverySteps = ['Check command syntax', 'Run with --help flag'];
            }
            break;
        case ErrorCategory.NOT_FOUND:
            base.message = 'File or resource not found';
            base.recoverySteps = [
                'Verify the path is correct',
                'Check if the file exists',
                'Ensure you are in the correct directory',
            ];
            break;
        case ErrorCategory.PERMISSION:
            base.message = 'Permission denied';
            base.recoverySteps = [
                'Check file permissions',
                'Try running with appropriate privileges',
                'Verify you have access to the directory',
            ];
            break;
        case ErrorCategory.NETWORK:
            base.message = 'Network connection failed';
            base.recoverySteps = [
                'Check your internet connection',
                'Verify the service is available',
                'Try again in a few moments',
            ];
            break;
        case ErrorCategory.VALIDATION:
            base.message = 'Validation error';
            base.recoverySteps = [
                'Check the input format',
                'Verify all required fields are provided',
                'Review the documentation for correct usage',
            ];
            break;
        default:
            base.message = 'An unexpected error occurred';
            base.recoverySteps = [
                'Try the operation again',
                'Check the logs for more details',
                'Report this issue if it persists',
            ];
    }
    return base;
}
//# sourceMappingURL=classifier.js.map
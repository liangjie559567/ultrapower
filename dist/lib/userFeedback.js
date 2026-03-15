/**
 * User Feedback Module
 *
 * Provides user-facing feedback mechanisms for progress, errors, and conflicts.
 */
export function showProgress(message, current, total) {
    console.log(`[Progress] ${message} (${current}/${total})`);
}
export function showError(message, recoverable) {
    const prefix = recoverable ? '[Recoverable Error]' : '[Fatal Error]';
    console.error(`${prefix} ${message}`);
}
export function showConflict(detected, selected) {
    console.warn(`[Conflict] Detected: ${detected.join(', ')} | Selected: ${selected}`);
}
//# sourceMappingURL=userFeedback.js.map
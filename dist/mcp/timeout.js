/**
 * Timeout Protection for Tool Calls
 */
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
/**
 * Execute function with timeout protection
 */
export async function withTimeout(fn, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs))
    ]);
}
//# sourceMappingURL=timeout.js.map
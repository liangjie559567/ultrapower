import { createLogger } from '../lib/unified-logger.js';
const logger = createLogger('hooks:timeout-wrapper');
/**
 * Execute a promise with timeout
 * Returns undefined if timeout occurs, otherwise returns the result
 */
export async function withTimeout(fn, options) {
    const { timeoutMs, label, onTimeout, fallback } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const result = await Promise.race([
            fn(),
            new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error(`Timeout after ${timeoutMs}ms`)))),
        ]);
        clearTimeout(timeoutId);
        return result;
    }
    catch (error) {
        clearTimeout(timeoutId);
        const isTimeout = error instanceof Error && error.message.includes('Timeout');
        if (isTimeout) {
            const elapsed = timeoutMs;
            logger.warn(`[hook-bridge] ${label} timeout after ${elapsed}ms`);
            if (onTimeout) {
                onTimeout(elapsed);
            }
            return fallback?.();
        }
        throw error;
    }
}
/**
 * Execute a sync function with timeout (for compatibility)
 */
export function withTimeoutSync(fn, options) {
    const { timeoutMs: _timeoutMs, label, onTimeout: _onTimeout, fallback } = options;
    const startTime = Date.now();
    try {
        return fn();
    }
    catch (error) {
        const elapsed = Date.now() - startTime;
        logger.warn(`[hook-bridge] ${label} error after ${elapsed}ms:`, error);
        return fallback?.();
    }
}
/**
 * Default fallback for pre-tool-use hooks
 */
export function defaultPreToolFallback() {
    return { continue: true };
}
/**
 * Default fallback for post-tool-use hooks
 */
export function defaultPostToolFallback() {
    return { continue: true };
}
//# sourceMappingURL=timeout-wrapper.js.map
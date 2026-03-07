/**
 * Timeout wrapper for hook operations
 * Prevents hooks from blocking tool execution indefinitely
 */

export interface TimeoutOptions {
  timeoutMs: number;
  label: string;
  onTimeout?: (elapsed: number) => void;
  fallback?: () => unknown;
}

/**
 * Execute a promise with timeout
 * Returns undefined if timeout occurs, otherwise returns the result
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions
): Promise<T | undefined> {
  const { timeoutMs, label, onTimeout, fallback } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        controller.signal.addEventListener('abort', () =>
          reject(new Error(`Timeout after ${timeoutMs}ms`))
        )
      ),
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error instanceof Error && error.message.includes('Timeout');

    if (isTimeout) {
      const elapsed = timeoutMs;
      console.warn(`[hook-bridge] ${label} timeout after ${elapsed}ms`);
      if (onTimeout) {
        onTimeout(elapsed);
      }
      return fallback?.() as T | undefined;
    }

    throw error;
  }
}

/**
 * Execute a sync function with timeout (for compatibility)
 */
export function withTimeoutSync<T>(
  fn: () => T,
  options: TimeoutOptions
): T | undefined {
  const { timeoutMs, label, onTimeout, fallback } = options;
  const startTime = Date.now();

  try {
    return fn();
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.warn(`[hook-bridge] ${label} error after ${elapsed}ms:`, error);
    return fallback?.() as T | undefined;
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

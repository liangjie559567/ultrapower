/**
 * Timeout Protection for Tool Calls
 */

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Execute function with timeout protection
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Codex Fallback Strategy
 * T3.2: Implements fallback to Agent when Codex MCP is unavailable/timeout
 */

import { withTimeout } from '../../mcp/timeout.js';

const CODEX_TIMEOUT_MS = 30000; // 30s

export interface CodexFallbackResult<T> {
  success: boolean;
  data?: T;
  fallbackUsed: boolean;
  error?: string;
}

/**
 * Execute with Codex MCP, fallback to Agent on failure/timeout
 */
export async function executeWithFallback<T>(
  codexFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  taskName: string
): Promise<CodexFallbackResult<T>> {
  try {
    const data = await withTimeout(codexFn, CODEX_TIMEOUT_MS);
    console.log(`[Fallback] ${taskName}: Codex succeeded`);
    return { success: true, data, fallbackUsed: false };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[Fallback] ${taskName}: Codex failed (${errorMsg}), using Agent fallback`);

    try {
      const data = await fallbackFn();
      return { success: true, data, fallbackUsed: true };
    } catch (fallbackError) {
      const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      return {
        success: false,
        fallbackUsed: true,
        error: `Both Codex and fallback failed: ${errorMsg} | ${fallbackMsg}`
      };
    }
  }
}

/**
 * Check if Codex MCP tool is available
 */
export function isCodexAvailable(): boolean {
  // Check if MCP tool exists in global scope
  return typeof (globalThis as any).mcp__plugin_ultrapower_x__ask_codex === 'function';
}

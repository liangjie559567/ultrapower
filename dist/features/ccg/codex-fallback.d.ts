/**
 * Codex Fallback Strategy
 * T3.2: Implements fallback to Agent when Codex MCP is unavailable/timeout
 */
export interface CodexFallbackResult<T> {
    success: boolean;
    data?: T;
    fallbackUsed: boolean;
    error?: string;
}
/**
 * Execute with Codex MCP, fallback to Agent on failure/timeout
 */
export declare function executeWithFallback<T>(codexFn: () => Promise<T>, fallbackFn: () => Promise<T>, taskName: string): Promise<CodexFallbackResult<T>>;
/**
 * Check if Codex MCP tool is available
 */
export declare function isCodexAvailable(): boolean;
//# sourceMappingURL=codex-fallback.d.ts.map
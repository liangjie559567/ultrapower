/**
 * OMC HUD - Context Limit Warning Element
 *
 * Renders a status indicator when context usage exceeds the configured threshold.
 * Monitoring only — no compact suggestions or autoCompact triggers.
 */
/**
 * Render a context usage status indicator.
 *
 * Returns a warning string when contextPercent >= threshold, null otherwise.
 *
 * @param contextPercent - Current context usage (0-100)
 * @param threshold - Configured threshold to trigger indicator (default 80)
 */
export declare function renderContextLimitWarning(contextPercent: number, threshold: number, _autoCompact?: boolean, _suppressedByCompact?: boolean): string | null;
//# sourceMappingURL=context-warning.d.ts.map
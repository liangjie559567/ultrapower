/**
 * Hook Bridge - TypeScript logic invoked by shell scripts
 *
 * This module provides the main entry point for shell hooks to call TypeScript
 * for complex processing. The shell script reads stdin, passes it to this module,
 * and writes the JSON output to stdout.
 *
 * Usage from shell:
 * ```bash
 * #!/bin/bash
 * INPUT=$(cat)
 * echo "$INPUT" | node ~/.claude/omc/hook-bridge.mjs --hook=keyword-detector
 * ```
 */
import type { HookInput, HookOutput, HookType } from "./bridge-types.js";
/**
 * Returns the required camelCase keys for a given hook type.
 * Centralizes key requirements to avoid drift between normalization and validation.
 */
export declare function requiredKeysForHook(hookType: string): string[];
/**
 * Fire-and-forget notification for AskUserQuestion (issue #597).
 * Extracted for testability; the dynamic import makes direct assertion
 * on the notify() call timing-sensitive, so tests spy on this wrapper instead.
 */
export declare function dispatchAskUserQuestionNotification(sessionId: string, directory: string, toolInput: unknown): void;
/** @internal Object wrapper so tests can spy on the dispatch call. */
export declare const _notify: {
    askUserQuestion: typeof dispatchAskUserQuestionNotification;
};
/**
 * Reset the skip hooks cache (for testing only)
 */
export declare function resetSkipHooksCache(): void;
/**
 * Main hook processor
 * Routes to specific hook handler based on type
 */
export declare function processHook(hookType: HookType, rawInput: HookInput): Promise<HookOutput>;
/**
 * CLI entry point for shell script invocation
 * Reads JSON from stdin, processes hook, writes JSON to stdout
 */
export declare function main(): Promise<void>;
//# sourceMappingURL=bridge.d.ts.map
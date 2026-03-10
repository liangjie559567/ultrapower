/**
 * Hook Bridge - TypeScript logic invoked by shell scripts
 */
import type { HookInput, HookOutput, HookType } from "./bridge-types.js";
import { requiredKeysForHook, resetSkipHooksCache } from "./validation.js";
export { resetSkipHooksCache, requiredKeysForHook };
/**
 * Main hook processor
 * Routes to specific hook handler based on type
 */
export declare function processHook(hookType: HookType, rawInput: HookInput): Promise<HookOutput>;
/**
 * CLI entry point for shell script invocation
 */
export declare function main(): Promise<void>;
//# sourceMappingURL=bridge.d.ts.map
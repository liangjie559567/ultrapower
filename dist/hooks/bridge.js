/**
 * Hook Bridge - TypeScript logic invoked by shell scripts
 */
import { pathToFileURL } from 'url';
import { normalizeHookInput } from "./bridge-normalize.js";
import { HookSeverity, HOOK_SEVERITY } from "./bridge-types.js";
import { loadHandler } from "./handlers/index.js";
import { HOOK_ROUTES } from "./handlers/route-map.js";
import { loadConfig } from "../config/loader.js";
import { requiredKeysForHook, getSkipHooks, resetSkipHooksCache } from "./validation.js";
export { resetSkipHooksCache, requiredKeysForHook };
/**
 * Main hook processor
 * Routes to specific hook handler based on type
 */
export async function processHook(hookType, rawInput) {
    // Environment kill-switches for plugin coexistence
    if (process.env.DISABLE_OMC === "1" || process.env.DISABLE_OMC === "true") {
        return { continue: true };
    }
    const skipHooks = getSkipHooks();
    if (skipHooks.includes(hookType)) {
        return { continue: true };
    }
    // Normalize snake_case fields from Claude Code to camelCase
    const input = normalizeHookInput(rawInput, hookType);
    try {
        // Try lazy-loaded handlers first
        const handler = await loadHandler(hookType);
        if (handler) {
            return await handler(input);
        }
        // Try route map
        const routeHandler = HOOK_ROUTES[hookType];
        if (routeHandler) {
            return await routeHandler(input);
        }
        // Unknown hook type
        return { continue: true };
    }
    catch (error) {
        console.error(`[hook-bridge] Error in ${hookType}:`, error);
        const severity = HOOK_SEVERITY[hookType];
        // CRITICAL hooks must block on error (security default)
        if (severity === HookSeverity.CRITICAL) {
            return {
                continue: false,
                reason: `Critical hook ${hookType} failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
        // HIGH severity hooks block by default (can be overridden via config)
        if (severity === HookSeverity.HIGH) {
            const config = loadConfig();
            const allowHighFailure = config?.hooks?.allowHighSeverityFailure ?? false;
            if (!allowHighFailure) {
                return {
                    continue: false,
                    reason: `High-severity hook ${hookType} failed: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
        // LOW severity hooks continue on error
        return { continue: true };
    }
}
/**
 * CLI entry point for shell script invocation
 */
export async function main() {
    const args = process.argv.slice(2);
    const hookArg = args.find((a) => a.startsWith("--hook="));
    if (!hookArg) {
        console.error("Usage: node hook-bridge.mjs --hook=<type>");
        process.exit(1);
    }
    const hookType = hookArg.slice("--hook=".length).trim();
    if (!hookType) {
        console.error("Invalid hook argument format: missing hook type");
        process.exit(1);
    }
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const inputStr = Buffer.concat(chunks).toString("utf-8");
    let input = {};
    try {
        input = JSON.parse(inputStr);
    }
    catch {
        // Invalid JSON, use empty object
    }
    const output = await processHook(hookType, input);
    console.log(JSON.stringify(output));
}
// Run if called directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((err) => {
        console.error("[hook-bridge] Fatal error:", err);
        process.exit(1);
    });
}
//# sourceMappingURL=bridge.js.map
/**
 * Hook Bridge - TypeScript logic invoked by shell scripts
 */
import { pathToFileURL } from 'url';
import { readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { normalizeHookInput } from "./bridge-normalize.js";
import { HookSeverity, HOOK_SEVERITY } from "./bridge-types.js";
import { loadHandler } from "./handlers/index.js";
import { HOOK_ROUTES } from "./handlers/route-map.js";
import { loadConfig } from "../config/loader.js";
import { requiredKeysForHook, getSkipHooks, resetSkipHooksCache } from "./validation.js";
import { clearStaleSessionDirs } from "./mode-registry/index.js";
import { logAuditEvent } from "../lib/auditLog.js";
export { resetSkipHooksCache, requiredKeysForHook };
/**
 * Clean up stale state files older than 24 hours
 */
function cleanupStaleStateFiles(cwd) {
    const stateDir = join(cwd, '.omc', 'state');
    const now = Date.now();
    const threshold = 24 * 60 * 60 * 1000; // 24 hours
    try {
        const files = readdirSync(stateDir);
        const cleaned = [];
        for (const file of files) {
            if (!file.endsWith('.json') || file === 'last-tool-error.json')
                continue;
            const filePath = join(stateDir, file);
            const stats = statSync(filePath);
            if (now - stats.mtimeMs > threshold) {
                unlinkSync(filePath);
                cleaned.push(file);
            }
        }
        if (cleaned.length > 0) {
            logAuditEvent('state_cleanup', 'low', { cleaned, count: cleaned.length }, cwd);
        }
    }
    catch (err) {
        // Silent fail - cleanup is best-effort
    }
}
let cleanupInitialized = false;
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
    // Run cleanup once per process
    if (!cleanupInitialized) {
        cleanupInitialized = true;
        const cwd = input.directory || input.cwd || process.cwd();
        cleanupStaleStateFiles(cwd);
    }
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
        // Clean up stale state on error
        const cwd = input.directory || input.cwd || process.cwd();
        try {
            clearStaleSessionDirs(cwd, 60 * 60 * 1000); // 1 hour
        }
        catch (cleanupError) {
            console.error('[hook-bridge] State cleanup failed:', cleanupError);
        }
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
    // Validate empty input
    if (!inputStr || inputStr.trim() === '') {
        console.error('[hook-bridge] Hook input is empty');
        process.exit(1);
    }
    let input = {};
    try {
        input = JSON.parse(inputStr);
    }
    catch (err) {
        console.error('[hook-bridge] Invalid JSON input:', err.message);
        process.exit(1);
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
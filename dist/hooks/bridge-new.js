/**
 * Hook Bridge - Modular routing layer
 */
import { pathToFileURL } from 'url';
import { normalizeHookInput } from "./bridge-normalize.js";
import { withTimeout } from "./timeout-wrapper.js";
import { safeJsonParse } from "../lib/safe-json.js";
import { registry } from "./registry/HookRegistry.js";
import { registerAllProcessors } from "./registry/registerProcessors.js";
import { createLogger } from '../lib/unified-logger.js';
const logger = createLogger('hooks:bridge-new');
// Initialize processors
registerAllProcessors();
function getSkipHooks() {
    const skip = process.env.OMC_SKIP_HOOKS || "";
    return skip.split(",").map(s => s.trim()).filter(Boolean);
}
export async function processHook(hookType, rawInput) {
    // Kill-switches
    if (process.env.DISABLE_OMC === "1" || process.env.DISABLE_OMC === "true") {
        return { continue: true };
    }
    const skipHooks = getSkipHooks();
    if (skipHooks.includes(hookType)) {
        return { continue: true };
    }
    const input = normalizeHookInput(rawInput, hookType);
    try {
        const processor = registry.get(hookType);
        if (processor) {
            const result = await withTimeout(() => processor(input), {
                timeoutMs: 30000,
                label: `hook-${hookType}`,
                fallback: () => ({ continue: true })
            });
            return result || { continue: true };
        }
        // Fallback for unregistered hooks
        return { continue: true };
    }
    catch (error) {
        logger.error(`[bridge] Error in ${hookType}:`, error);
        return { continue: true };
    }
}
export async function main() {
    const args = process.argv.slice(2);
    const hookArg = args.find((a) => a.startsWith("--hook="));
    if (!hookArg) {
        logger.error("Usage: node hook-bridge.mjs --hook=<type>");
        process.exit(1);
    }
    const hookTypeRaw = hookArg.slice("--hook=".length).trim();
    if (!hookTypeRaw) {
        logger.error("Invalid hook argument format: missing hook type");
        process.exit(1);
    }
    const hookType = hookTypeRaw;
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const inputStr = Buffer.concat(chunks).toString("utf-8");
    const result = safeJsonParse(inputStr);
    const input = result.success ? result.data : {};
    const output = await processHook(hookType, input);
    logger.info(JSON.stringify(output));
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((err) => {
        logger.error("[hook-bridge] Fatal error:", err);
        process.exit(1);
    });
}
//# sourceMappingURL=bridge-new.js.map
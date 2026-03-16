import { requiredKeysForHook, validateHookInput } from "../validation.js";
import { toSubagentStartInput, toSubagentStopInput, toPermissionRequestInput, toSessionEndInput, toPreCompactInput, toSetupInput, toWorkflowGateInput } from "../bridge-converter.js";
export const HOOK_ROUTES = {
    "session-end": async (input) => {
        if (!validateHookInput(input, requiredKeysForHook("session-end"), "session-end")) {
            return { continue: true };
        }
        const { handleSessionEnd } = await import("../session-end/index.js");
        return await handleSessionEnd(toSessionEndInput(input));
    },
    "subagent-start": async (input) => {
        if (!validateHookInput(input, requiredKeysForHook("subagent-start"), "subagent-start")) {
            return { continue: true };
        }
        const { processSubagentStart } = await import("../subagent-tracker/index.js");
        return processSubagentStart(toSubagentStartInput(input));
    },
    "subagent-stop": async (input) => {
        if (!validateHookInput(input, requiredKeysForHook("subagent-stop"), "subagent-stop")) {
            return { continue: true };
        }
        const { processSubagentStop } = await import("../subagent-tracker/index.js");
        return processSubagentStop(toSubagentStopInput(input));
    },
    "pre-compact": async (input) => {
        if (!validateHookInput(input, requiredKeysForHook("pre-compact"), "pre-compact")) {
            return { continue: true };
        }
        const { processPreCompact } = await import("../pre-compact/index.js");
        return await processPreCompact(toPreCompactInput(input));
    },
    "setup-init": async (input) => {
        if (!validateHookInput(input, requiredKeysForHook("setup-init"), "setup-init")) {
            return { continue: true };
        }
        const { processSetup } = await import("../setup/index.js");
        return await processSetup(toSetupInput({ ...input, trigger: "init" }));
    },
    "setup-maintenance": async (input) => {
        if (!validateHookInput(input, requiredKeysForHook("setup-maintenance"), "setup-maintenance")) {
            return { continue: true };
        }
        const { processSetup } = await import("../setup/index.js");
        return await processSetup(toSetupInput({ ...input, trigger: "maintenance" }));
    },
    "permission-request": async (input) => {
        if (!validateHookInput(input, requiredKeysForHook("permission-request"), "permission-request")) {
            return { continue: false };
        }
        const { handlePermissionRequest } = await import("../permission-handler/index.js");
        const { auditLogger } = await import("../../audit/logger.js");
        const permInput = toPermissionRequestInput(input);
        const result = await handlePermissionRequest(permInput);
        auditLogger.log({
            actor: 'agent',
            action: 'permission_request',
            resource: permInput.tool_name,
            result: result.continue ? 'success' : 'failure',
            metadata: { tool_use_id: permInput.tool_use_id, permission_mode: permInput.permission_mode }
        }).catch(() => { });
        return result;
    },
    "user-prompt-submit": async (input) => {
        if (!validateHookInput(input, requiredKeysForHook("user-prompt-submit"), "user-prompt-submit")) {
            return { continue: true };
        }
        const { processWorkflowGate } = await import("../workflow-gate/index.js");
        const result = await processWorkflowGate(toWorkflowGateInput(input));
        if (result.shouldBlock && result.injectedSkill) {
            return {
                continue: true,
                message: result.message,
                additionalContext: `\n\n<workflow-gate>\n${result.message}\n\n请先调用 /ultrapower:${result.injectedSkill} skill。\n</workflow-gate>`
            };
        }
        return { continue: true };
    },
};
//# sourceMappingURL=route-map.js.map
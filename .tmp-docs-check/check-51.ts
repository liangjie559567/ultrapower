export const HOOK_ROUTES: Partial<Record<HookType, HookHandler>> = {
  "session-end": async (input) => {
    const { handleSessionEnd } = await import("../session-end/index.js");
    return await handleSessionEnd(input);
  },

  "subagent-start": async (input) => {
    const { processSubagentStart } = await import("../subagent-tracker/index.js");
    return processSubagentStart(toSubagentStartInput(input));
  },

  "subagent-stop": async (input) => {
    const { processSubagentStop } = await import("../subagent-tracker/index.js");
    return processSubagentStop(toSubagentStopInput(input));
  },

  "pre-compact": async (input) => {
    const { processPreCompact } = await import("../pre-compact/index.js");
    return await processPreCompact(input);
  },

  "setup-init": async (input) => {
    const { processSetup } = await import("../setup/index.js");
    return await processSetup({ ...input, trigger: "init" });
  },

  "setup-maintenance": async (input) => {
    const { processSetup } = await import("../setup/index.js");
    return await processSetup({ ...input, trigger: "maintenance" });
  },

  "permission-request": async (input) => {
    const { handlePermissionRequest } = await import("../permission-handler/index.js");
    const { auditLogger } = await import("../../audit/logger.js");
    const result = await handlePermissionRequest(toPermissionRequestInput(input));

    // 审计日志记录
    auditLogger.log({
      actor: 'agent',
      action: 'permission_request',
      resource: input.tool_name,
      result: result.continue ? 'success' : 'failure'
    });

    return result;
  },

  "user-prompt-submit": async (input) => {
    const { processWorkflowGate } = await import("../workflow-gate/index.js");
    const result = await processWorkflowGate(input);

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

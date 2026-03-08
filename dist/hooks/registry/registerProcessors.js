import { registry } from "./HookRegistry.js";
import { processKeywordDetector, processDelegationEnforcer, processOrchestratorPreToolUse, processOrchestratorPostToolUse, processSessionStart, processSessionEnd, processUserPromptSubmit, processFileSave, processSetup, processAgentExecutionComplete, processPermissionRequest, } from "../processors/index.js";
export function registerAllProcessors() {
    registry.register("keyword-detector", processKeywordDetector);
    registry.register("delegation-enforcer", processDelegationEnforcer);
    registry.register("omc-orchestrator-pre-tool", processOrchestratorPreToolUse);
    registry.register("omc-orchestrator-post-tool", processOrchestratorPostToolUse);
    registry.register("session-start", processSessionStart);
    registry.register("session-end", processSessionEnd);
    registry.register("user-prompt-submit", processUserPromptSubmit);
    registry.register("file-save", processFileSave);
    registry.register("setup", processSetup);
    registry.register("agent-execution-complete", processAgentExecutionComplete);
    registry.register("permission-request", processPermissionRequest);
}
//# sourceMappingURL=registerProcessors.js.map
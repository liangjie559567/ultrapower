import { processOrchestratorPreTool } from "../omc-orchestrator/index.js";
export async function processOrchestratorPreToolUse(input) {
    const toolExecuteInput = {
        toolName: input.toolName || input.tool_name || "",
        toolInput: (input.toolInput || input.tool_input),
        sessionId: input.sessionId || input.session_id,
        directory: input.directory || input.cwd,
    };
    return processOrchestratorPreTool(toolExecuteInput);
}
//# sourceMappingURL=orchestratorPreTool.js.map
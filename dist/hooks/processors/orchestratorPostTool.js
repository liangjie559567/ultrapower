import { processOrchestratorPostTool } from "../omc-orchestrator/index.js";
export async function processOrchestratorPostToolUse(input) {
    const toolExecuteInput = {
        toolName: input.toolName || input.tool_name || "",
        toolInput: (input.toolInput || input.tool_input),
        sessionId: input.sessionId || input.session_id,
        directory: input.directory || input.cwd,
    };
    const output = (input.toolOutput || input.tool_response || "");
    return processOrchestratorPostTool(toolExecuteInput, output);
}
//# sourceMappingURL=orchestratorPostTool.js.map
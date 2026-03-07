import type { HookInput, HookOutput } from "../bridge-types.js";
import { processOrchestratorPreTool } from "../omc-orchestrator/index.js";

export async function processOrchestratorPreToolUse(input: HookInput): Promise<HookOutput> {
  const toolExecuteInput = {
    toolName: input.toolName || input.tool_name || "",
    toolInput: (input.toolInput || input.tool_input) as Record<string, unknown> | undefined,
    sessionId: input.sessionId || input.session_id,
    directory: input.directory || input.cwd,
  };
  return processOrchestratorPreTool(toolExecuteInput);
}

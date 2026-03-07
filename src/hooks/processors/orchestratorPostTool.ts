import type { HookInput, HookOutput } from "../bridge-types.js";
import { processOrchestratorPostTool } from "../omc-orchestrator/index.js";

export async function processOrchestratorPostToolUse(input: HookInput): Promise<HookOutput> {
  const toolExecuteInput = {
    toolName: input.toolName || input.tool_name || "",
    toolInput: (input.toolInput || input.tool_input) as Record<string, unknown> | undefined,
    sessionId: input.sessionId || input.session_id,
    directory: input.directory || input.cwd,
  };
  const output = (input.toolOutput || input.tool_response || "") as string;
  return processOrchestratorPostTool(toolExecuteInput, output);
}

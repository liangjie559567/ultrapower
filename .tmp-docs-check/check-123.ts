// bridge.ts 中的集成点
async function processPreToolUse(input: ToolInput): Promise<ToolInput> {
  if (input.tool_name === 'Task' && input.tool_input.subagent_type) {
    const agentType = extractAgentType(input.tool_input.subagent_type);
    const model = resolveModelForAgent(agentType);
    if (model && !input.tool_input.model) {
      input.tool_input.model = model;
    }
  }
  return input;
}

import { processPreToolUse as enforceDelegationModel } from "../../features/delegation-enforcer.js";
export async function processDelegationEnforcer(input) {
    const toolName = input.toolName || input.tool_name || "";
    const toolInput = input.toolInput || input.tool_input;
    const result = enforceDelegationModel(toolName, toolInput);
    return { continue: true, modifiedInput: result.modifiedInput };
}
//# sourceMappingURL=delegationEnforcer.js.map
import type { HookInput, HookOutput } from "../bridge-types.js";

export async function processAgentExecutionComplete(input: HookInput): Promise<HookOutput> {
  return { continue: true };
}

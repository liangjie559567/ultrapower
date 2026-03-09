import type { HookInput, HookOutput } from "../bridge-types.js";

export async function processAgentExecutionComplete(_input: HookInput): Promise<HookOutput> {
  return { continue: true };
}

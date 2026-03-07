import type { HookInput, HookOutput } from "../bridge-types.js";

export async function processUserPromptSubmit(input: HookInput): Promise<HookOutput> {
  return { continue: true };
}

import type { HookInput, HookOutput } from "../bridge-types.js";

export async function processSetup(input: HookInput): Promise<HookOutput> {
  return { continue: true };
}

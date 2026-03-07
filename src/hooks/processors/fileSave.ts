import type { HookInput, HookOutput } from "../bridge-types.js";

export async function processFileSave(input: HookInput): Promise<HookOutput> {
  return { continue: true };
}

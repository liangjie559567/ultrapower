import type { HookInput, HookOutput } from "../bridge-types.js";

export async function processSessionEnd(input: HookInput): Promise<HookOutput> {
  return { continue: true };
}

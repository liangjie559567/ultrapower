import type { HookInput, HookOutput } from "../bridge-types.js";

export async function processPermissionRequest(input: HookInput): Promise<HookOutput> {
  return { continue: true };
}

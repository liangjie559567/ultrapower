import type { HookInput, HookOutput } from "../bridge-types.js";
import { loadConfig } from "../../config/loader.js";

export async function processSessionStart(input: HookInput): Promise<HookOutput> {
  const config = await loadConfig();
  const mode = config.defaultExecutionMode || "sequential";

  const messages: string[] = [];
  if (mode === "ultrawork") messages.push("ULTRAWORK mode enabled");
  if (mode === "ultrathink") messages.push("ULTRATHINK mode enabled");
  if (config.enableAutoSearch) messages.push("Auto-search enabled");
  if (config.enableAutoAnalyze) messages.push("Auto-analyze enabled");

  return { continue: true, message: messages.join("\n\n") };
}

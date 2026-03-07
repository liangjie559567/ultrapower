import type { HookInput, HookOutput } from "../bridge-types.js";
import { removeCodeBlocks, getAllKeywords } from "../keyword-detector/index.js";

export async function processKeywordDetector(input: HookInput): Promise<HookOutput> {
  const text = (input.text as string) || "";
  const cleanText = removeCodeBlocks(text);
  const keywords = getAllKeywords(cleanText);
  return { continue: true, message: JSON.stringify({ keywords }) };
}

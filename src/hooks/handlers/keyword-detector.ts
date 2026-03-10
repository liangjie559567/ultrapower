import type { HookInput, HookOutput } from "../bridge-types.js";
import { removeCodeBlocks, getAllKeywords } from "../keyword-detector/index.js";
import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";
import {
  RALPH_MESSAGE,
  ULTRAWORK_MESSAGE,
  ULTRATHINK_MESSAGE,
  SEARCH_MESSAGE,
  ANALYZE_MESSAGE,
} from "../../installer/hooks.js";

function getPromptText(input: HookInput): string {
  const toolInput = input.toolInput as { prompt?: string; message?: string } | undefined;
  return input.prompt || toolInput?.prompt || toolInput?.message || "";
}

export async function processKeywordDetector(input: HookInput): Promise<HookOutput> {
  const promptText = getPromptText(input);
  if (!promptText) {
    return { continue: true };
  }

  const cleanedText = removeCodeBlocks(promptText);
  const keywords = getAllKeywords(cleanedText);

  if (keywords.length === 0) {
    return { continue: true };
  }

  const sessionId = input.sessionId;
  const directory = resolveToWorktreeRoot(input.directory);
  const messages: string[] = [];

  for (const keywordType of keywords) {
    switch (keywordType) {
      case "ralph": {
        const { createRalphLoopHook } = await import("../ralph/index.js");
        const hook = createRalphLoopHook(directory);
        hook.startLoop(sessionId, promptText);
        messages.push(RALPH_MESSAGE);
        break;
      }

      case "ultrawork": {
        const { activateUltrawork } = await import("../ultrawork/index.js");
        activateUltrawork(promptText, sessionId, directory);
        messages.push(ULTRAWORK_MESSAGE);
        break;
      }

      case "ultrathink":
        messages.push(ULTRATHINK_MESSAGE);
        break;

      case "deepsearch":
        messages.push(SEARCH_MESSAGE);
        break;

      case "analyze":
        messages.push(ANALYZE_MESSAGE);
        break;

      case "cancel":
      case "autopilot":
      case "team":
      case "pipeline":
      case "ralplan":
      case "plan":
      case "tdd":
        messages.push(
          `[MODE: ${keywordType.toUpperCase()}] Skill invocation handled by UserPromptSubmit hook.`,
        );
        break;

      default:
        break;
    }
  }

  if (messages.length === 0) {
    return { continue: true };
  }

  return {
    continue: true,
    message: messages.join("\n\n---\n\n"),
  };
}

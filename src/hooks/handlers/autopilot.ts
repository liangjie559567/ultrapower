import type { HookInput, HookOutput } from "../bridge-types.js";
import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";

export async function processAutopilot(input: HookInput): Promise<HookOutput> {
  const directory = resolveToWorktreeRoot(input.directory);

  const { readAutopilotState, getPhasePrompt } = await import("../autopilot/index.js");

  const state = readAutopilotState(directory, input.sessionId);

  if (!state || !state.active) {
    return { continue: true };
  }

  const context = {
    idea: state.originalIdea,
    specPath: state.expansion.spec_path || ".omc/autopilot/spec.md",
    planPath: state.planning.plan_path || ".omc/plans/autopilot-impl.md",
  };

  const phasePrompt = getPhasePrompt(state.phase, context);

  if (phasePrompt) {
    return {
      continue: true,
      message: `[AUTOPILOT - Phase: ${state.phase.toUpperCase()}]\n\n${phasePrompt}`,
    };
  }

  return { continue: true };
}

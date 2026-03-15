import type { HookInput, HookOutput } from "../bridge-types.js";
import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";

interface TeamState {
  active?: boolean;
  current_phase?: string;
  stage?: string;
  status?: string;
  team_name?: string;
  teamName?: string;
}

async function readTeamStagedState(directory: string): Promise<TeamState | null> {
  try {
    const { readStateFile } = await import("../state/StateReader.js");
    return readStateFile("team", directory) as TeamState;
  } catch {
    return null;
  }
}

function isTeamStateTerminal(state: TeamState): boolean {
  const phase = state.current_phase || state.stage;
  const status = state.status;
  return phase === "complete" || phase === "failed" || phase === "cancelled" || status === "cancelled";
}

function getTeamStage(state: TeamState): string {
  return state.current_phase || state.stage || "team-plan";
}

function getTeamStagePrompt(stage: string): string {
  const prompts: Record<string, string> = {
    "team-plan": "Coordinate planning and task breakdown.",
    "team-prd": "Define requirements and acceptance criteria.",
    "team-exec": "Execute implementation tasks.",
    "team-verify": "Continue verification with verifier agents.",
    "team-fix": "Address verification failures in fix loop.",
  };
  return prompts[stage] || "Continue team workflow.";
}

export async function processStopContinuation(input: HookInput): Promise<HookOutput> {
  const directory = resolveToWorktreeRoot(input.directory);
  const teamState = await readTeamStagedState(directory);

  if (teamState?.active) {
    const stage = getTeamStage(teamState);
    const teamName = teamState.team_name || teamState.teamName || "team";

    if (isTeamStateTerminal(teamState)) {
      return {
        continue: true,
        message: `[TEAM MODE TERMINAL STATE DETECTED]\n\nTeam "${teamName}" is in terminal state (${stage}).\nRun cleanup and clear Team state files.`
      };
    }

    if (stage === "team-verify" || stage === "team-fix") {
      return {
        continue: true,
        message: `[TEAM MODE CONTINUATION]\n\nTeam "${teamName}" stage: ${stage}\n${getTeamStagePrompt(stage)}`
      };
    }
  }

  return { continue: true };
}

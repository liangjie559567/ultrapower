import { existsSync, readFileSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { safeJsonParse } from "../lib/safe-json.js";

const TEAM_TERMINAL_VALUES = new Set([
  "completed", "complete", "cancelled", "canceled", "cancel",
  "failed", "aborted", "terminated", "done",
]);

export interface TeamStagedState {
  active?: boolean;
  stage?: string;
  current_stage?: string;
  currentStage?: string;
  status?: string;
  session_id?: string;
  sessionId?: string;
  team_name?: string;
  teamName?: string;
  started_at?: string;
  startedAt?: string;
  task?: string;
  cancelled?: boolean;
  canceled?: boolean;
  completed?: boolean;
  terminal?: boolean;
}

export async function readTeamStagedState(
  directory: string,
  sessionId?: string,
): Promise<TeamStagedState | null> {
  const stateDir = join(directory, ".omc", "state");
  const statePaths = sessionId
    ? [
        join(stateDir, "sessions", sessionId, "team-state.json"),
        join(stateDir, "team-state.json"),
      ]
    : [join(stateDir, "team-state.json")];

  for (const statePath of statePaths) {
    try {
      const content = await readFile(statePath, "utf-8");
      const result = safeJsonParse<TeamStagedState>(content, statePath);

      if (!result.success || typeof result.data !== "object" || result.data === null) {
        continue;
      }

      const stateSessionId = result.data.session_id || result.data.sessionId;
      if (sessionId && stateSessionId && stateSessionId !== sessionId) {
        continue;
      }

      return result.data;
    } catch {
      continue;
    }
  }

  return null;
}

export function readTeamStagedStateSync(
  directory: string,
  sessionId?: string,
): TeamStagedState | null {
  const stateDir = join(directory, ".omc", "state");
  const statePaths = sessionId
    ? [
        join(stateDir, "sessions", sessionId, "team-state.json"),
        join(stateDir, "team-state.json"),
      ]
    : [join(stateDir, "team-state.json")];

  for (const statePath of statePaths) {
    if (!existsSync(statePath)) {
      continue;
    }

    const content = readFileSync(statePath, "utf-8");
    const result = safeJsonParse<TeamStagedState>(content, statePath);

    if (!result.success || typeof result.data !== "object" || result.data === null) {
      continue;
    }

    const stateSessionId = result.data.session_id || result.data.sessionId;
    if (sessionId && stateSessionId && stateSessionId !== sessionId) {
      continue;
    }

    return result.data;
  }

  return null;
}

export function getTeamStage(state: TeamStagedState): string {
  return state.stage || state.current_stage || state.currentStage || "team-exec";
}

export function isTeamStateTerminal(state: TeamStagedState): boolean {
  if (state.terminal === true || state.cancelled === true || state.canceled === true || state.completed === true) {
    return true;
  }

  const status = String(state.status || "").toLowerCase();
  const stage = String(getTeamStage(state)).toLowerCase();

  return TEAM_TERMINAL_VALUES.has(status) || TEAM_TERMINAL_VALUES.has(stage);
}

export function getTeamStagePrompt(stage: string): string {
  switch (stage) {
    case "team-plan":
      return "Continue planning and decomposition, then move into execution once the task graph is ready.";
    case "team-prd":
      return "Continue clarifying scope and acceptance criteria, then proceed to execution once criteria are explicit.";
    case "team-exec":
      return "Continue execution: monitor teammates, unblock dependencies, and drive tasks to terminal status for this pass.";
    case "team-verify":
      return "Continue verification: validate outputs, run required checks, and decide pass or fix-loop entry.";
    case "team-fix":
      return "Continue fix loop work, then return to execution/verification until no required follow-up remains.";
    default:
      return "Continue from the current Team stage and preserve staged workflow semantics.";
  }
}

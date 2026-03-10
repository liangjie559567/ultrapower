import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";
async function readTeamStagedState(directory) {
    try {
        const { readStateFile } = await import("../state/StateReader.js");
        return readStateFile("team", directory);
    }
    catch {
        return null;
    }
}
function isTeamStateTerminal(state) {
    const phase = state.current_phase || state.stage;
    const status = state.status;
    return phase === "complete" || phase === "failed" || phase === "cancelled" || status === "cancelled";
}
function getTeamStage(state) {
    return state.current_phase || state.stage || "team-plan";
}
function getTeamStagePrompt(stage) {
    const prompts = {
        "team-plan": "Coordinate planning and task breakdown.",
        "team-prd": "Define requirements and acceptance criteria.",
        "team-exec": "Execute implementation tasks.",
        "team-verify": "Continue verification with verifier agents.",
        "team-fix": "Address verification failures in fix loop.",
    };
    return prompts[stage] || "Continue team workflow.";
}
export async function processStopContinuation(input) {
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
//# sourceMappingURL=stop-continuation.js.map
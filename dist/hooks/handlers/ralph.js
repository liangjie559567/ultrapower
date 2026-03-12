import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";
export async function processRalph(input) {
    const sessionId = input.sessionId;
    const directory = resolveToWorktreeRoot(input.directory);
    if (!sessionId) {
        return { continue: true };
    }
    const { readRalphState, incrementRalphIteration, clearRalphState, readVerificationState, getArchitectVerificationPrompt, clearVerificationState, } = await import("../ralph/index.js");
    const state = readRalphState(directory);
    if (!state || !state.active) {
        return { continue: true };
    }
    if (state.session_id !== sessionId) {
        return { continue: true };
    }
    const verificationState = readVerificationState(directory);
    if (verificationState?.pending) {
        const verificationPrompt = getArchitectVerificationPrompt(verificationState);
        return {
            continue: true,
            message: verificationPrompt,
        };
    }
    if (state.iteration >= state.max_iterations) {
        clearRalphState(directory);
        clearVerificationState(directory);
        return {
            continue: true,
            message: `[RALPH LOOP STOPPED] Max iterations (${state.max_iterations}) reached without completion.`,
        };
    }
    const newState = incrementRalphIteration(directory);
    if (!newState) {
        return { continue: true };
    }
    const continuationPrompt = `[RALPH LOOP - ITERATION ${newState.iteration}/${newState.max_iterations}]

The task is NOT complete yet. Continue working.

IMPORTANT:
- Review your progress so far
- Continue from where you left off
- When FULLY complete (after Architect verification), run \`/ultrapower:cancel\` to cleanly exit and clean up state files. If cancel fails, retry with \`/ultrapower:cancel --force\`.
- Do not stop until the task is truly done

Original task:
${newState.prompt}`;
    return {
        continue: true,
        message: continuationPrompt,
    };
}
//# sourceMappingURL=ralph.js.map
import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";
import { processOrchestratorPreTool } from "../omc-orchestrator/index.js";
import { processPreToolUse as enforceDelegationModel } from "../../features/delegation-enforcer.js";
import { withTimeout } from "../timeout-wrapper.js";
import { addBackgroundTask, getRunningTaskCount } from "../../hud/background-tasks.js";
import { loadConfig } from "../../config/loader.js";
import { getAgentDashboard } from "../subagent-tracker/index.js";
import { recordFileTouch } from "../subagent-tracker/session-replay.js";
const PKILL_F_FLAG_PATTERN = /\bpkill\b.*\s-f\b/;
const PKILL_FULL_FLAG_PATTERN = /\bpkill\b.*--full\b/;
export function dispatchAskUserQuestionNotification(sessionId, directory, toolInput) {
    const input = toolInput;
    const questions = input?.questions || [];
    const questionText = questions.map(q => q.question || "").filter(Boolean).join("; ") || "User input requested";
    import("../../notifications/index.js").then(({ notify }) => notify("ask-user-question", {
        sessionId,
        projectPath: directory,
        question: questionText,
        profileName: process.env.OMC_NOTIFY_PROFILE,
    }).catch((err) => {
        if (process.env.OMC_DEBUG) {
            console.error(`[bridge] ask-user-question notification failed: ${err.message}`);
        }
    })).catch((err) => {
        if (process.env.OMC_DEBUG) {
            console.error(`[bridge] notification import failed: ${err.message}`);
        }
    });
}
export const _notify = {
    askUserQuestion: dispatchAskUserQuestionNotification,
};
export async function processPreToolUse(input) {
    const directory = resolveToWorktreeRoot(input.directory);
    const enforcementResult = await withTimeout(() => Promise.resolve(processOrchestratorPreTool({
        toolName: input.toolName || "",
        toolInput: input.toolInput || {},
        sessionId: input.sessionId,
        directory,
    })), {
        timeoutMs: 3000,
        label: 'orchestrator-pre-tool',
        fallback: () => ({ continue: true })
    }) || { continue: true };
    if (!enforcementResult.continue) {
        return {
            continue: false,
            reason: enforcementResult.reason,
            message: enforcementResult.message,
        };
    }
    if (input.toolName === "AskUserQuestion" && input.sessionId) {
        _notify.askUserQuestion(input.sessionId, directory, input.toolInput);
    }
    if (input.toolName === "Bash") {
        const command = input.toolInput?.command ?? "";
        if (PKILL_F_FLAG_PATTERN.test(command) ||
            PKILL_FULL_FLAG_PATTERN.test(command)) {
            return {
                continue: true,
                message: [
                    "WARNING: `pkill -f` matches its own process command line and will self-terminate the shell (exit code 144 = SIGTERM).",
                    "Safer alternatives:",
                    "  - `pkill <exact-process-name>` (without -f)",
                    '  - `kill $(pgrep -f "pattern")` (pgrep does not kill itself)',
                    "Proceeding anyway, but the command may kill this shell session.",
                ].join("\n"),
            };
        }
    }
    if (input.toolName === "Task" || input.toolName === "Bash") {
        const toolInput = input.toolInput;
        if (toolInput?.run_in_background) {
            const config = loadConfig();
            const maxBgTasks = config.permissions?.maxBackgroundTasks ?? 5;
            const runningCount = getRunningTaskCount(directory);
            if (runningCount >= maxBgTasks) {
                return {
                    continue: false,
                    reason: `Background process limit reached (${runningCount}/${maxBgTasks}). ` +
                        `Wait for running tasks to complete before starting new ones. ` +
                        `Limit is configurable via permissions.maxBackgroundTasks in config or OMC_MAX_BACKGROUND_TASKS env var.`,
                };
            }
        }
    }
    if (input.toolName === "Task") {
        const toolInput = input.toolInput;
        if (toolInput?.description) {
            const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            addBackgroundTask(taskId, toolInput.description, toolInput.subagent_type, directory);
        }
    }
    if (input.toolName === "Edit" || input.toolName === "Write") {
        const toolInput = input.toolInput;
        if (toolInput?.file_path && input.sessionId) {
            recordFileTouch(directory, input.sessionId, "orchestrator", toolInput.file_path);
        }
    }
    const delegationResult = enforceDelegationModel(input.toolName || '', input.toolInput);
    if (input.toolName === "Task") {
        const dashboard = getAgentDashboard(directory);
        if (dashboard) {
            const combined = enforcementResult.message
                ? `${enforcementResult.message}\n\n${dashboard}`
                : dashboard;
            return {
                continue: true,
                modifiedInput: delegationResult.modifiedInput,
                message: combined,
            };
        }
    }
    return {
        continue: true,
        modifiedInput: delegationResult.modifiedInput,
        ...(enforcementResult.message ? { message: enforcementResult.message } : {}),
    };
}
//# sourceMappingURL=pre-tool-use.js.map
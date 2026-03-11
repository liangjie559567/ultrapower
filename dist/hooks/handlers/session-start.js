import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
const fileCache = new Map();
async function readFileCached(path) {
    const stat = await import("fs/promises").then(m => m.stat(path));
    const cached = fileCache.get(path);
    if (cached && cached.mtime === stat.mtimeMs) {
        return cached.content;
    }
    const content = await readFile(path, "utf-8");
    fileCache.set(path, { content, mtime: stat.mtimeMs });
    return content;
}
export async function processSessionStart(input) {
    const sessionId = input.sessionId || "";
    const directory = resolveToWorktreeRoot(input.directory);
    const { initSilentAutoUpdate } = await import("../../features/auto-update.js");
    const { readAutopilotState } = await import("../autopilot/index.js");
    const { readUltraworkState } = await import("../ultrawork/index.js");
    const { checkIncompleteTodos } = await import("../todo-continuation/index.js");
    initSilentAutoUpdate();
    if (sessionId) {
        import("../../notifications/index.js").then(({ notify }) => notify("session-start", {
            sessionId,
            projectPath: directory,
            profileName: process.env.OMC_NOTIFY_PROFILE,
        }).catch((err) => {
            if (process.env.OMC_DEBUG) {
                console.error(`[bridge] session-start notification failed: ${err.message}`);
            }
        })).catch((err) => {
            if (process.env.OMC_DEBUG) {
                console.error(`[bridge] notification import failed: ${err.message}`);
            }
        });
    }
    if (sessionId) {
        Promise.all([
            import("../../notifications/reply-listener.js"),
            import("../../notifications/config.js"),
        ]).then(([{ startReplyListener }, { getReplyConfig, getNotificationConfig, getReplyListenerPlatformConfig },]) => {
            const replyConfig = getReplyConfig();
            if (!replyConfig)
                return;
            const notifConfig = getNotificationConfig();
            const platformConfig = getReplyListenerPlatformConfig(notifConfig);
            startReplyListener({
                ...replyConfig,
                ...platformConfig,
            });
        }).catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            if (process.env.OMC_DEBUG) {
                process.stderr.write(`[bridge] reply-listener setup error: ${msg}\n`);
            }
        });
    }
    const messages = [];
    const autopilotState = readAutopilotState(directory);
    if (autopilotState?.active && autopilotState.session_id === sessionId) {
        messages.push(`<session-restore>

[AUTOPILOT MODE RESTORED]

You have an active autopilot session from ${autopilotState.started_at}.
Original idea: ${autopilotState.originalIdea}
Current phase: ${autopilotState.phase}

Continue autopilot execution until complete.

</session-restore>

---

`);
    }
    const ultraworkState = readUltraworkState(directory);
    if (ultraworkState?.active && ultraworkState.session_id === sessionId) {
        messages.push(`<session-restore>

[ULTRAWORK MODE RESTORED]

You have an active ultrawork session from ${ultraworkState.started_at}.
Original task: ${ultraworkState.original_prompt}

Continue working in ultrawork mode until all tasks are complete.

</session-restore>

---

`);
    }
    const teamState = await import("../team-state-reader.js").then(m => m.readTeamStagedState(directory, sessionId));
    if (teamState?.active) {
        const { getTeamStage, isTeamStateTerminal, getTeamStagePrompt } = await import("../team-state-reader.js");
        const teamName = teamState.team_name || teamState.teamName || "team";
        const stage = getTeamStage(teamState);
        if (isTeamStateTerminal(teamState)) {
            messages.push(`<session-restore>

[TEAM MODE TERMINAL STATE DETECTED]

Team "${teamName}" stage state is terminal (${stage}).
If this is expected, run normal cleanup/cancel completion flow and clear stale Team state files.

</session-restore>

---

`);
        }
        else {
            messages.push(`<session-restore>

[TEAM MODE RESTORED]

You have an active Team staged run for "${teamName}".
Current stage: ${stage}
${getTeamStagePrompt(stage)}

Resume from this stage and continue the staged Team workflow.

</session-restore>

---

`);
        }
    }
    const agentsMdPath = join(directory, 'AGENTS.md');
    if (existsSync(agentsMdPath)) {
        try {
            let agentsContent = (await readFileCached(agentsMdPath)).trim();
            if (agentsContent) {
                const MAX_AGENTS_CHARS = 10000;
                let truncationNotice = '';
                if (agentsContent.length > MAX_AGENTS_CHARS) {
                    agentsContent = agentsContent.slice(0, MAX_AGENTS_CHARS);
                    truncationNotice = `\n\n[Note: Content was truncated. For full context, read: ${agentsMdPath}]`;
                }
                messages.push(`<session-restore>

[ROOT AGENTS.md LOADED]

The following project documentation was generated by deepinit to help AI agents understand the codebase:

${agentsContent}${truncationNotice}

</session-restore>

---

`);
            }
        }
        catch {
            // Skip if file can't be read
        }
    }
    const todoResult = await checkIncompleteTodos(sessionId, directory);
    if (todoResult.count > 0) {
        messages.push(`<session-restore>

[PENDING TASKS DETECTED]

You have ${todoResult.count} incomplete tasks from a previous session.
Please continue working on these tasks.

</session-restore>

---

`);
    }
    if (messages.length > 0) {
        return {
            continue: true,
            message: messages.join("\n"),
        };
    }
    return { continue: true };
}
//# sourceMappingURL=session-start.js.map
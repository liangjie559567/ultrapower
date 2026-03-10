import type { HookInput, HookOutput } from "../bridge-types.js";
import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";

interface StopContext {
  stop_reason?: string;
  stopReason?: string;
  user_requested?: boolean;
  userRequested?: boolean;
}

export async function processPersistentMode(input: HookInput): Promise<HookOutput> {
  const sessionId = input.sessionId || "";
  const directory = resolveToWorktreeRoot(input.directory);

  const { checkPersistentModes, createHookOutput } = await import("../persistent-mode/index.js");

  const stopContext: StopContext = {
    stop_reason: (input as Record<string, unknown>).stop_reason as string | undefined,
    stopReason: (input as Record<string, unknown>).stopReason as string | undefined,
    user_requested: (input as Record<string, unknown>).user_requested as boolean | undefined,
    userRequested: (input as Record<string, unknown>).userRequested as boolean | undefined,
  };

  const result = await checkPersistentModes(sessionId, directory, stopContext);
  const output = createHookOutput(result);

  const teamState = await import("../team-state-reader.js").then(m => m.readTeamStagedState(directory, sessionId));
  if (!teamState || teamState.active !== true) {
    if (result.mode === "none" && sessionId) {
      const isAbort = stopContext.user_requested === true || stopContext.userRequested === true;
      const isContextLimit = stopContext.stop_reason === "context_limit" || stopContext.stopReason === "context_limit";
      if (!isAbort && !isContextLimit) {
        import("../../notifications/index.js").then(({ notify }) =>
          notify("session-idle", {
            sessionId,
            projectPath: directory,
            profileName: process.env.OMC_NOTIFY_PROFILE,
          }).catch((err) => {
            import("../../audit/logger.js").then(({ auditLogger }) => {
              auditLogger.log({
                actor: "bridge",
                action: "session-idle-notification",
                resource: sessionId,
                result: "failure",
                metadata: { error: err.message }
              }).catch(() => {});
            });
            if (process.env.OMC_DEBUG) {
              console.error(`[bridge] session-idle notification failed: ${err.message}`);
            }
          })
        ).catch((err) => {
          import("../../audit/logger.js").then(({ auditLogger }) => {
            auditLogger.log({
              actor: "bridge",
              action: "notification-import",
              resource: "notifications/index.js",
              result: "failure",
              metadata: { error: err.message }
            }).catch(() => {});
          });
          if (process.env.OMC_DEBUG) {
            console.error(`[bridge] notification import failed: ${err.message}`);
          }
        });
      }
    }
    return output;
  }

  const { getTeamStage, isTeamStateTerminal, getTeamStagePrompt } = await import("../team-state-reader.js");

  if (isTeamStateTerminal(teamState)) {
    return output;
  }

  const stage = getTeamStage(teamState);
  const stagePrompt = getTeamStagePrompt(stage);
  const teamName = teamState.team_name || teamState.teamName || "team";
  const currentMessage = output.message ? `${output.message}\n` : "";

  return {
    ...output,
    message: `${currentMessage}<team-stage-continuation>

[TEAM MODE CONTINUATION]

Team "${teamName}" is currently in stage: ${stage}
${stagePrompt}

While stage state is active and non-terminal, keep progressing the staged workflow.
When team verification passes or cancel is requested, allow terminal cleanup behavior.

</team-stage-continuation>

---

`,
  };
}

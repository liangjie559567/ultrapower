import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";
import { processOrchestratorPostTool } from "../omc-orchestrator/index.js";
import { withTimeout } from "../timeout-wrapper.js";
import { getAgentDashboard } from "../subagent-tracker/index.js";
import { recordUsage, extractAgentRole, extractSkillName } from "../learner/usage-tracker.js";
function getInvokedSkillName(toolInput) {
    if (!toolInput || typeof toolInput !== "object") {
        return null;
    }
    const input = toolInput;
    const rawSkill = input.skill ??
        input.skill_name ??
        input.skillName ??
        input.command ??
        null;
    if (typeof rawSkill !== "string" || rawSkill.trim().length === 0) {
        return null;
    }
    const normalized = rawSkill.trim();
    const namespaced = normalized.includes(":")
        ? normalized.split(":").at(-1)
        : normalized;
    return namespaced?.toLowerCase() || null;
}
export async function processPostToolUse(input) {
    const directory = resolveToWorktreeRoot(input.directory);
    const messages = [];
    const toolName = (input.toolName || "").toLowerCase();
    if (toolName === "skill") {
        const skillName = getInvokedSkillName(input.toolInput);
        if (skillName === "ralph") {
            const { createRalphLoopHook } = await import("../ralph/index.js");
            const promptText = typeof input.prompt === "string" && input.prompt.trim().length > 0
                ? input.prompt
                : "Ralph loop activated via Skill tool";
            const hook = createRalphLoopHook(directory);
            hook.startLoop(input.sessionId, promptText);
        }
    }
    const orchestratorResult = await withTimeout(() => Promise.resolve(processOrchestratorPostTool({
        toolName: input.toolName || "",
        toolInput: input.toolInput || {},
        sessionId: input.sessionId,
        directory,
    }, String(input.toolOutput ?? ""))), {
        timeoutMs: 3000,
        label: 'orchestrator-post-tool',
        fallback: () => ({ continue: true })
    }) || { continue: true };
    if (orchestratorResult.message) {
        messages.push(orchestratorResult.message);
    }
    if (input.toolName === "Task") {
        const dashboard = getAgentDashboard(directory);
        if (dashboard) {
            messages.push(dashboard);
        }
    }
    recordUsage(directory, {
        toolName: input.toolName ?? '',
        agentRole: extractAgentRole(input.toolName ?? '', input.toolInput),
        skillName: extractSkillName(input.toolName ?? '', input.toolInput),
        timestamp: Date.now(),
        sessionId: input.sessionId ?? '',
    }).catch(() => { });
    if (messages.length > 0) {
        return {
            continue: true,
            message: messages.join("\n\n"),
        };
    }
    return { continue: true };
}
//# sourceMappingURL=post-tool-use.js.map
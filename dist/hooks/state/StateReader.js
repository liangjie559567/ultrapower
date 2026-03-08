import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { resolveToWorktreeRoot } from "../../lib/worktree-paths.js";
import { safeJsonParse } from "../../lib/safe-json.js";
export function readStateFile(mode, cwd) {
    const worktreeRoot = resolveToWorktreeRoot(cwd);
    const statePath = join(worktreeRoot, ".omc", "state", `${mode}-state.json`);
    if (!existsSync(statePath))
        return null;
    const content = readFileSync(statePath, "utf-8");
    return safeJsonParse(content);
}
export function hasActiveState(mode, cwd) {
    const state = readStateFile(mode, cwd);
    return state?.active === true;
}
//# sourceMappingURL=StateReader.js.map
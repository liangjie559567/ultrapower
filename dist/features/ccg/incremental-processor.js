import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export async function getChangedFiles(baseBranch = 'main', cwd) {
    try {
        const { stdout } = await execAsync(`git diff --name-only --cached`, { cwd });
        return stdout.trim().split('\n').filter(Boolean);
    }
    catch {
        return [];
    }
}
export async function getUntrackedFiles(cwd) {
    try {
        const { stdout } = await execAsync('git ls-files --others --exclude-standard', { cwd });
        return stdout.trim().split('\n').filter(Boolean);
    }
    catch {
        return [];
    }
}
export async function getAllChangedFiles(baseBranch = 'main', cwd) {
    const [changed, untracked] = await Promise.all([
        getChangedFiles(baseBranch, cwd),
        getUntrackedFiles(cwd)
    ]);
    return [...new Set([...changed, ...untracked])];
}
//# sourceMappingURL=incremental-processor.js.map
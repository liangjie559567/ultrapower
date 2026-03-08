/**
 * Git Utilities - Optimized Git Command Execution
 *
 * Provides optimized git operations with:
 * - --no-pager flag for faster execution
 * - Batch operations to reduce git calls
 * - Caching for frequently accessed data
 */
import { spawnSync } from 'child_process';
const GIT_TIMEOUT = 5000;
const CACHE_TTL = 1000; // 1 second cache
const cache = new Map();
function getCached(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.value;
}
function setCache(key, value) {
    cache.set(key, { value, timestamp: Date.now() });
}
export function clearGitCache() {
    cache.clear();
}
/**
 * Execute git command with --no-pager for faster execution
 */
function execGit(command, cwd) {
    try {
        const args = ['--no-pager', ...command.split(/\s+/)];
        const result = spawnSync('git', args, {
            cwd,
            encoding: 'utf-8',
            timeout: GIT_TIMEOUT,
        });
        return result.status === 0 ? result.stdout.trim() : '';
    }
    catch {
        return '';
    }
}
/**
 * Get worktree root (cached)
 */
export function getWorktreeRoot(cwd) {
    const key = `root:${cwd || process.cwd()}`;
    const cached = getCached(key);
    if (cached)
        return cached;
    try {
        const root = execGit('rev-parse --show-toplevel', cwd);
        if (root) {
            setCache(key, root);
            return root;
        }
    }
    catch {
        // execGit failed, not a git repo
    }
    return null;
}
/**
 * Get current branch (cached)
 */
export function getCurrentBranch(cwd) {
    const key = `branch:${cwd || process.cwd()}`;
    const cached = getCached(key);
    if (cached)
        return cached;
    const branch = execGit('branch --show-current', cwd);
    if (branch) {
        setCache(key, branch);
        return branch;
    }
    return null;
}
/**
 * Get repository name from remote URL (cached)
 */
export function getRepoName(cwd) {
    const key = `repo:${cwd || process.cwd()}`;
    const cached = getCached(key);
    if (cached)
        return cached;
    const url = execGit('remote get-url origin', cwd);
    if (!url)
        return null;
    const match = url.match(/\/([^/]+?)(?:\.git)?$/) || url.match(/:([^/]+?)(?:\.git)?$/);
    const repo = match ? match[1].replace(/\.git$/, '') : null;
    if (repo) {
        setCache(key, repo);
    }
    return repo;
}
export function getGitInfo(cwd) {
    const effectiveCwd = cwd || process.cwd();
    // Try to get from cache first
    const root = getWorktreeRoot(effectiveCwd);
    const branch = getCurrentBranch(effectiveCwd);
    const repo = getRepoName(effectiveCwd);
    return { root, branch, repo };
}
/**
 * Get git status (porcelain format)
 */
export function getStatus(cwd) {
    return execGit('status --porcelain', cwd);
}
/**
 * Get git diff stats
 */
export function getDiffStats(cwd) {
    return execGit('diff --numstat HEAD', cwd);
}
/**
 * Get modified files list
 */
export function getModifiedFiles(cwd) {
    const output = execGit('diff --name-only', cwd);
    return output ? output.split('\n').filter(Boolean) : [];
}
/**
 * Get git directory path
 */
export function getGitDir(cwd) {
    const dir = execGit('rev-parse --git-dir', cwd);
    return dir || null;
}
export function getStatusAndDiff(cwd) {
    // Execute both commands but git is smart enough to reuse internal state
    return {
        status: getStatus(cwd),
        diffStats: getDiffStats(cwd),
    };
}
//# sourceMappingURL=git-utils.js.map
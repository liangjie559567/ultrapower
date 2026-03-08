/**
 * Git Utilities - Optimized Git Command Execution
 *
 * Provides optimized git operations with:
 * - --no-pager flag for faster execution
 * - Batch operations to reduce git calls
 * - Caching for frequently accessed data
 */
export declare function clearGitCache(): void;
/**
 * Get worktree root (cached)
 */
export declare function getWorktreeRoot(cwd?: string): string | null;
/**
 * Get current branch (cached)
 */
export declare function getCurrentBranch(cwd?: string): string | null;
/**
 * Get repository name from remote URL (cached)
 */
export declare function getRepoName(cwd?: string): string | null;
/**
 * Batch fetch git info (root, branch, repo) in one call
 */
export interface GitInfo {
    root: string | null;
    branch: string | null;
    repo: string | null;
}
export declare function getGitInfo(cwd?: string): GitInfo;
/**
 * Get git status (porcelain format)
 */
export declare function getStatus(cwd?: string): string;
/**
 * Get git diff stats
 */
export declare function getDiffStats(cwd?: string): string;
/**
 * Get modified files list
 */
export declare function getModifiedFiles(cwd?: string): string[];
/**
 * Get git directory path
 */
export declare function getGitDir(cwd?: string): string | null;
/**
 * Batch operation: Get status + diff stats together
 */
export interface StatusAndDiff {
    status: string;
    diffStats: string;
}
export declare function getStatusAndDiff(cwd?: string): StatusAndDiff;
//# sourceMappingURL=git-utils.d.ts.map
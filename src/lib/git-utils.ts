/**
 * Git Utilities - Optimized Git Command Execution
 *
 * Provides optimized git operations with:
 * - --no-pager flag for faster execution
 * - Batch operations to reduce git calls
 * - Caching for frequently accessed data
 */

import { execSync } from 'child_process';

const GIT_TIMEOUT = 5000;
const CACHE_TTL = 1000; // 1 second cache

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache<T>(key: string, value: T): void {
  cache.set(key, { value, timestamp: Date.now() });
}

export function clearGitCache(): void {
  cache.clear();
}

/**
 * Execute git command with --no-pager for faster execution
 */
function execGit(command: string, cwd?: string): string {
  try {
    return execSync(`git --no-pager ${command}`, {
      cwd,
      encoding: 'utf-8',
      timeout: GIT_TIMEOUT,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32' ? 'cmd.exe' : undefined,
    }).trim();
  } catch {
    return '';
  }
}

/**
 * Get worktree root (cached)
 */
export function getWorktreeRoot(cwd?: string): string | null {
  const key = `root:${cwd || process.cwd()}`;
  const cached = getCached<string>(key);
  if (cached) return cached;

  try {
    const root = execGit('rev-parse --show-toplevel', cwd);
    if (root) {
      setCache(key, root);
      return root;
    }
  } catch {}
  return null;
}

/**
 * Get current branch (cached)
 */
export function getCurrentBranch(cwd?: string): string | null {
  const key = `branch:${cwd || process.cwd()}`;
  const cached = getCached<string>(key);
  if (cached) return cached;

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
export function getRepoName(cwd?: string): string | null {
  const key = `repo:${cwd || process.cwd()}`;
  const cached = getCached<string>(key);
  if (cached) return cached;

  const url = execGit('remote get-url origin', cwd);
  if (!url) return null;

  const match = url.match(/\/([^/]+?)(?:\.git)?$/) || url.match(/:([^/]+?)(?:\.git)?$/);
  const repo = match ? match[1].replace(/\.git$/, '') : null;
  if (repo) {
    setCache(key, repo);
  }
  return repo;
}

/**
 * Batch fetch git info (root, branch, repo) in one call
 */
export interface GitInfo {
  root: string | null;
  branch: string | null;
  repo: string | null;
}

export function getGitInfo(cwd?: string): GitInfo {
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
export function getStatus(cwd?: string): string {
  return execGit('status --porcelain', cwd);
}

/**
 * Get git diff stats
 */
export function getDiffStats(cwd?: string): string {
  return execGit('diff --numstat HEAD', cwd);
}

/**
 * Get modified files list
 */
export function getModifiedFiles(cwd?: string): string[] {
  const output = execGit('diff --name-only', cwd);
  return output ? output.split('\n').filter(Boolean) : [];
}

/**
 * Get git directory path
 */
export function getGitDir(cwd?: string): string | null {
  const dir = execGit('rev-parse --git-dir', cwd);
  return dir || null;
}

/**
 * Batch operation: Get status + diff stats together
 */
export interface StatusAndDiff {
  status: string;
  diffStats: string;
}

export function getStatusAndDiff(cwd?: string): StatusAndDiff {
  // Execute both commands but git is smart enough to reuse internal state
  return {
    status: getStatus(cwd),
    diffStats: getDiffStats(cwd),
  };
}

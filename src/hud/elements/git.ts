/**
 * OMC HUD - Git Elements
 *
 * Renders git repository name and branch information.
 */

import { dim, cyan } from '../colors.js';
import { getRepoName, getCurrentBranch } from '../../lib/git-utils.js';

/**
 * Get git repository name from remote URL.
 * @param cwd - Working directory to run git command in
 * @returns Repository name or null if not available
 */
export function getGitRepoName(cwd?: string): string | null {
  return getRepoName(cwd);
}

/**
 * Get current git branch name.
 * @param cwd - Working directory to run git command in
 * @returns Branch name or null if not available
 */
export function getGitBranch(cwd?: string): string | null {
  return getCurrentBranch(cwd);
}

/**
 * Render git repository name element.
 *
 * @param cwd - Working directory
 * @returns Formatted repo name or null
 */
export function renderGitRepo(cwd?: string): string | null {
  const repo = getGitRepoName(cwd);
  if (!repo) return null;
  return `${dim('repo:')}${cyan(repo)}`;
}

/**
 * Render git branch element.
 *
 * @param cwd - Working directory
 * @returns Formatted branch name or null
 */
export function renderGitBranch(cwd?: string): string | null {
  const branch = getGitBranch(cwd);
  if (!branch) return null;
  return `${dim('branch:')}${cyan(branch)}`;
}

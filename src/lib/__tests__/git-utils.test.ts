/**
 * Git Utils Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWorktreeRoot,
  getCurrentBranch,
  getRepoName,
  getGitInfo,
  clearGitCache,
} from '../git-utils.js';

describe('git-utils', () => {
  beforeEach(() => {
    clearGitCache();
  });

  it('should get worktree root', () => {
    const root = getWorktreeRoot();
    expect(root).toBeTruthy();
  });

  it('should cache worktree root', () => {
    const root1 = getWorktreeRoot();
    const root2 = getWorktreeRoot();
    expect(root1).toBe(root2);
  });

  it('should get current branch', () => {
    const branch = getCurrentBranch();
    expect(branch).toBeTruthy();
  });

  it('should get repo name', () => {
    const repo = getRepoName();
    expect(repo).toBeTruthy();
  });

  it('should batch fetch git info', () => {
    const info = getGitInfo();
    expect(info.root).toBeTruthy();
    expect(info.branch).toBeTruthy();
  });
});

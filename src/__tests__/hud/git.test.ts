import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGitRepoName, getGitBranch, renderGitRepo, renderGitBranch } from '../../hud/elements/git.js';

// Mock git-utils
vi.mock('../../lib/git-utils.js', () => ({
  getRepoName: vi.fn(),
  getCurrentBranch: vi.fn(),
}));

import { getRepoName, getCurrentBranch } from '../../lib/git-utils.js';
const mockGetRepoName = vi.mocked(getRepoName);
const mockGetCurrentBranch = vi.mocked(getCurrentBranch);

describe('git elements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGitRepoName', () => {
    it('returns repo name', () => {
      mockGetRepoName.mockReturnValue('my-repo');
      expect(getGitRepoName()).toBe('my-repo');
    });

    it('returns null when not available', () => {
      mockGetRepoName.mockReturnValue(null);
      expect(getGitRepoName()).toBeNull();
    });

    it('passes cwd option', () => {
      mockGetRepoName.mockReturnValue('repo');
      getGitRepoName('/some/path');
      expect(mockGetRepoName).toHaveBeenCalledWith('/some/path');
    });
  });

  describe('getGitBranch', () => {
    it('returns current branch name', () => {
      mockGetCurrentBranch.mockReturnValue('main');
      expect(getGitBranch()).toBe('main');
    });

    it('handles feature branch names', () => {
      mockGetCurrentBranch.mockReturnValue('feature/my-feature');
      expect(getGitBranch()).toBe('feature/my-feature');
    });

    it('returns null when not available', () => {
      mockGetCurrentBranch.mockReturnValue(null);
      expect(getGitBranch()).toBeNull();
    });

    it('passes cwd option', () => {
      mockGetCurrentBranch.mockReturnValue('main');
      getGitBranch('/some/path');
      expect(mockGetCurrentBranch).toHaveBeenCalledWith('/some/path');
    });
  });

  describe('renderGitRepo', () => {
    it('renders formatted repo name', () => {
      mockGetRepoName.mockReturnValue('my-repo');
      const result = renderGitRepo();
      expect(result).toContain('repo:');
      expect(result).toContain('my-repo');
    });

    it('returns null when repo not available', () => {
      mockGetRepoName.mockReturnValue(null);
      expect(renderGitRepo()).toBeNull();
    });

    it('applies styling', () => {
      mockGetRepoName.mockReturnValue('repo');
      const result = renderGitRepo();
      expect(result).toContain('\x1b['); // contains ANSI escape codes
    });
  });

  describe('renderGitBranch', () => {
    it('renders formatted branch name', () => {
      mockGetCurrentBranch.mockReturnValue('main');
      const result = renderGitBranch();
      expect(result).toContain('branch:');
      expect(result).toContain('main');
    });

    it('returns null when branch not available', () => {
      mockGetCurrentBranch.mockReturnValue(null);
      expect(renderGitBranch()).toBeNull();
    });

    it('applies styling', () => {
      mockGetCurrentBranch.mockReturnValue('main');
      const result = renderGitBranch();
      expect(result).toContain('\x1b['); // contains ANSI escape codes
    });
  });
});

import { describe, it, expect } from 'vitest';
import { GitAnalyzer } from '../git-analyzer.js';

describe('Git Analyzer', () => {
  it('should get modified files', () => {
    const files = GitAnalyzer.getModifiedFiles(process.cwd());
    expect(Array.isArray(files)).toBe(true);
  });

  it('should get recent commits', () => {
    const commits = GitAnalyzer.getRecentCommits(process.cwd());
    expect(Array.isArray(commits)).toBe(true);
  });
});

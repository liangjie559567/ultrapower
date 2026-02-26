import { describe, it, expect } from 'vitest';
import { syncToRemote, buildGitCommitMessage } from '../consciousness-sync.js';

describe('buildGitCommitMessage', () => {
  it('includes session ID in commit message', () => {
    const msg = buildGitCommitMessage('abc123', 3);
    expect(msg).toContain('abc123');
    expect(msg).toContain('3 event');
  });

  it('sanitizes special characters in session ID', () => {
    const msg = buildGitCommitMessage('abc/123!@#', 1);
    expect(msg).not.toContain('/');
    expect(msg).not.toContain('!');
    expect(msg).not.toContain('@');
    expect(msg).not.toContain('#');
  });

  it('truncates session ID to 8 characters', () => {
    const msg = buildGitCommitMessage('abcdefghijklmnop', 2);
    expect(msg).toContain('abcdefgh');
    expect(msg).not.toContain('abcdefghi');
  });
});

describe('syncToRemote', () => {
  it('returns false when nexus is disabled', async () => {
    const result = await syncToRemote('/nonexistent/dir', 'sess-001');
    expect(result.success).toBe(false);
  });
});

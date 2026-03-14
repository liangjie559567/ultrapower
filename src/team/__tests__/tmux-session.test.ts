import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn()
}));

import { sanitizeName, sessionName, createSession, killSession, validateTmux, isSessionAlive, listActiveSessions, spawnBridgeInSession } from '../tmux-session.js';
import { execSync, execFileSync } from 'child_process';

describe('sanitizeName', () => {
  it('passes alphanumeric names', () => {
    expect(sanitizeName('worker1')).toBe('worker1');
  });

  it('removes invalid characters', () => {
    expect(sanitizeName('worker@1!')).toBe('worker1');
  });

  it('allows hyphens', () => {
    expect(sanitizeName('my-worker')).toBe('my-worker');
  });

  it('truncates to 50 chars', () => {
    const long = 'a'.repeat(100);
    expect(sanitizeName(long).length).toBe(50);
  });

  it('throws for all-invalid names', () => {
    expect(() => sanitizeName('!!!@@@')).toThrow('no valid characters');
  });

  it('rejects 1-char result after sanitization', () => {
    expect(() => sanitizeName('a')).toThrow('too short');
  });

  it('accepts 2-char result after sanitization', () => {
    expect(sanitizeName('ab')).toBe('ab');
  });
});

describe('sessionName', () => {
  it('builds correct session name', () => {
    expect(sessionName('myteam', 'codex1')).toBe('omc-team-myteam-codex1');
  });

  it('sanitizes both parts', () => {
    expect(sessionName('my team!', 'work@er')).toBe('omc-team-myteam-worker');
  });
});

// NOTE: createSession, killSession require tmux to be installed.
// Gate with: describe.skipIf(!hasTmux)('tmux integration', () => { ... })

function hasTmux(): boolean {
  try {
    const { execSync } = require('child_process');
    execSync('tmux -V', { stdio: 'pipe', timeout: 3000 });
    return true;
  } catch { return false; }
}

describe.skipIf(!hasTmux())('createSession with workingDirectory', () => {

  it('accepts optional workingDirectory param', () => {
    // Should not throw — workingDirectory is optional
    const name = createSession('tmuxtest', 'wdtest', '/tmp');
    expect(name).toBe('omc-team-tmuxtest-wdtest');
    killSession('tmuxtest', 'wdtest');
  });

  it('works without workingDirectory param', () => {
    const name = createSession('tmuxtest', 'nowd');
    expect(name).toBe('omc-team-tmuxtest-nowd');
    killSession('tmuxtest', 'nowd');
  });
});

describe('validateTmux (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when tmux is available', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('tmux 3.2'));
    expect(() => validateTmux()).not.toThrow();
  });

  it('throws with install instructions when tmux not found', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not found'); });
    expect(() => validateTmux()).toThrow('tmux is not available');
    expect(() => validateTmux()).toThrow('brew install tmux');
  });
});

describe('isSessionAlive (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when session exists', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(''));
    expect(isSessionAlive('team1', 'worker1')).toBe(true);
  });

  it('returns false when session does not exist', () => {
    vi.mocked(execFileSync).mockImplementation(() => { throw new Error('session not found'); });
    expect(isSessionAlive('team1', 'worker1')).toBe(false);
  });
});

describe('listActiveSessions (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns worker names for matching sessions', () => {
    vi.mocked(execFileSync).mockReturnValue('omc-team-myteam-worker1\nomc-team-myteam-worker2\nother-session\n');
    const workers = listActiveSessions('myteam');
    expect(workers).toEqual(['worker1', 'worker2']);
  });

  it('returns empty array when no sessions exist', () => {
    vi.mocked(execFileSync).mockImplementation(() => { throw new Error('no sessions'); });
    expect(listActiveSessions('team1')).toEqual([]);
  });

  it('filters out non-matching sessions', () => {
    vi.mocked(execFileSync).mockReturnValue('omc-team-team1-worker1\nomc-team-team2-worker2\n');
    expect(listActiveSessions('team1')).toEqual(['worker1']);
  });
});

describe('spawnBridgeInSession (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends correct command to tmux session', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(''));
    spawnBridgeInSession('test-session', '/path/to/bridge.js', '/tmp/config.json');

    expect(execFileSync).toHaveBeenCalledWith(
      'tmux',
      ['send-keys', '-t', 'test-session', 'node "/path/to/bridge.js" --config "/tmp/config.json"', 'Enter'],
      { stdio: 'pipe', timeout: 5000 }
    );
  });
});

describe('createSession and killSession (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kills existing session before creating new one', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(''));
    createSession('team1', 'worker1');

    expect(execFileSync).toHaveBeenCalledWith(
      'tmux',
      ['kill-session', '-t', 'omc-team-team1-worker1'],
      expect.any(Object)
    );
  });

  it('creates session with correct parameters', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(''));
    const name = createSession('team1', 'worker1', '/tmp');

    expect(name).toBe('omc-team-team1-worker1');
    expect(execFileSync).toHaveBeenCalledWith(
      'tmux',
      ['new-session', '-d', '-s', 'omc-team-team1-worker1', '-x', '200', '-y', '50', '-c', '/tmp'],
      { stdio: 'pipe', timeout: 5000 }
    );
  });

  it('killSession ignores errors when session does not exist', () => {
    vi.mocked(execFileSync).mockImplementation(() => { throw new Error('no session'); });
    expect(() => killSession('team1', 'worker1')).not.toThrow();
  });
});

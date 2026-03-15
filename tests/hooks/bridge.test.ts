import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { clearStaleSessionDirs } from '../../src/hooks/mode-registry/index';

describe('BUG-004 状态文件泄漏', () => {
  const testDir = join(process.cwd(), '.test-cleanup');

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should remove empty session directories', () => {
    const sessionsDir = join(testDir, '.omc', 'state', 'sessions');
    const emptySession = join(sessionsDir, 'empty-session-123');
    mkdirSync(emptySession, { recursive: true });

    const removed = clearStaleSessionDirs(testDir, 0);
    expect(removed).toContain('empty-session-123');
    expect(existsSync(emptySession)).toBe(false);
  });

  it('should remove stale session directories older than threshold', () => {
    const sessionsDir = join(testDir, '.omc', 'state', 'sessions');
    const staleSession = join(sessionsDir, 'stale-session-456');
    mkdirSync(staleSession, { recursive: true });

    const staleFile = join(staleSession, 'autopilot-state.json');
    writeFileSync(staleFile, JSON.stringify({ active: false }));

    // Set maxAge to 0 to treat all files as stale
    const removed = clearStaleSessionDirs(testDir, 0);
    expect(removed.length).toBeGreaterThan(0);
    expect(existsSync(staleSession)).toBe(false);
  });

  it('should preserve recent session directories', () => {
    const sessionsDir = join(testDir, '.omc', 'state', 'sessions');
    const recentSession = join(sessionsDir, 'recent-session-789');
    mkdirSync(recentSession, { recursive: true });

    const recentFile = join(recentSession, 'autopilot-state.json');
    writeFileSync(recentFile, JSON.stringify({ active: true }));

    // Use 24 hour threshold - recent files should be preserved
    const removed = clearStaleSessionDirs(testDir, 24 * 60 * 60 * 1000);
    expect(removed).not.toContain('recent-session-789');
    expect(existsSync(recentSession)).toBe(true);
  });
});

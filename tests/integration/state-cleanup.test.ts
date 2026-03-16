import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { clearStaleSessionDirs } from '../../src/hooks/mode-registry/index';

describe('Integration: State Cleanup (BUG-004)', () => {
  const testDir = join(process.cwd(), '.test-integration-cleanup');

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

  it('should auto-cleanup after abnormal exit', () => {
    const sessionsDir = join(testDir, '.omc', 'state', 'sessions');
    const crashedSession = join(sessionsDir, 'crashed-session-001');
    mkdirSync(crashedSession, { recursive: true });

    writeFileSync(
      join(crashedSession, 'autopilot-state.json'),
      JSON.stringify({ active: true, startedAt: Date.now() - 48 * 60 * 60 * 1000 })
    );

    const removed = clearStaleSessionDirs(testDir, 0);
    expect(removed).toContain('crashed-session-001');
    expect(existsSync(crashedSession)).toBe(false);
  });

  it('should cleanup stale sessions on startup', () => {
    const sessionsDir = join(testDir, '.omc', 'state', 'sessions');

    const stale1 = join(sessionsDir, 'stale-1');
    const stale2 = join(sessionsDir, 'stale-2');
    const recent = join(sessionsDir, 'recent-1');

    mkdirSync(stale1, { recursive: true });
    mkdirSync(stale2, { recursive: true });
    mkdirSync(recent, { recursive: true });

    writeFileSync(join(stale1, 'ralph-state.json'), JSON.stringify({ active: false }));
    writeFileSync(join(stale2, 'ultrawork-state.json'), JSON.stringify({ active: false }));
    writeFileSync(join(recent, 'team-state.json'), JSON.stringify({ active: true }));

    const removed = clearStaleSessionDirs(testDir, 0);

    expect(removed.length).toBeGreaterThanOrEqual(2);
    expect(existsSync(stale1)).toBe(false);
    expect(existsSync(stale2)).toBe(false);
  });
});

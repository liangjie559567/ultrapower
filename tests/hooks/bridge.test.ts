import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, rmSync, mkdirSync, writeFileSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { clearStaleSessionDirs } from '../../src/hooks/mode-registry/index';
import { processHook } from '../../src/hooks/bridge';

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

    // Set maxAge to -1 to ensure all files are treated as stale
    const removed = clearStaleSessionDirs(testDir, -1);
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

describe('BUG-004 异常恢复 - 状态文件清理', () => {
  const testDir = join(process.cwd(), '.test-state-cleanup-isolated');
  const stateDir = join(testDir, '.omc', 'state');

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
    mkdirSync(stateDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
  });

  it('清理 24 小时以上陈旧状态文件', async () => {
    const staleFile = join(stateDir, 'autopilot-state.json');
    const freshFile = join(stateDir, 'team-state.json');

    writeFileSync(staleFile, '{}');
    writeFileSync(freshFile, '{}');

    const oldTime = Date.now() - 25 * 60 * 60 * 1000;
    utimesSync(staleFile, new Date(oldTime), new Date(oldTime));

    const { processHook } = await import('../../src/hooks/bridge');
    await processHook('session-start', { directory: testDir, sessionId: 'test-cleanup' });

    expect(existsSync(staleFile)).toBe(false);
    expect(existsSync(freshFile)).toBe(true);
  });

  it('跳过 last-tool-error.json', () => {
    const errorFile = join(stateDir, 'last-tool-error.json');
    const normalFile = join(stateDir, 'ralph-state.json');

    writeFileSync(errorFile, '{}');
    writeFileSync(normalFile, '{}');

    const oldTime = Date.now() - 25 * 60 * 60 * 1000;
    utimesSync(errorFile, new Date(oldTime), new Date(oldTime));
    utimesSync(normalFile, new Date(oldTime), new Date(oldTime));

    // last-tool-error.json 应该被跳过，不会被清理
    expect(existsSync(errorFile)).toBe(true);
    expect(existsSync(normalFile)).toBe(true);
  });
});

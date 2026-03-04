import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  getSessionStartTime,
  recordSessionMetrics,
  cleanupTransientState,
  cleanupModeStates,
  exportSessionSummary
} from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-session-end');

describe('Session End Hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('getSessionStartTime', () => {
    it('returns undefined for non-existent state', () => {
      const result = getSessionStartTime(TEST_DIR);
      expect(result).toBeUndefined();
    });

    it('reads start time from state file', () => {
      const stateDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(
        join(stateDir, 'autopilot-state.json'),
        JSON.stringify({ started_at: '2026-03-03T10:00:00Z', session_id: 'test' })
      );

      const result = getSessionStartTime(TEST_DIR, 'test');
      expect(result).toBe('2026-03-03T10:00:00Z');
    });
  });

  describe('recordSessionMetrics', () => {
    it('records session metrics', () => {
      const input = {
        session_id: 'test-session',
        transcript_path: '',
        cwd: TEST_DIR,
        permission_mode: 'default',
        hook_event_name: 'SessionEnd' as const,
        reason: 'clear' as const
      };

      const metrics = recordSessionMetrics(TEST_DIR, input);
      expect(metrics.session_id).toBe('test-session');
      expect(metrics.reason).toBe('clear');
      expect(metrics.agents_spawned).toBe(0);
    });
  });

  describe('cleanupTransientState', () => {
    it('returns 0 for empty directory', () => {
      const result = cleanupTransientState(TEST_DIR);
      expect(result).toBe(0);
    });
  });

  describe('cleanupModeStates', () => {
    it('cleans active mode states', () => {
      const stateDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(
        join(stateDir, 'autopilot-state.json'),
        JSON.stringify({ active: true, session_id: 'test' })
      );

      const result = cleanupModeStates(TEST_DIR, 'test');
      expect(result.filesRemoved).toBe(1);
      expect(result.modesCleaned).toContain('autopilot');
    });
  });

  describe('exportSessionSummary', () => {
    it('exports session summary', () => {
      const metrics = {
        session_id: 'test',
        ended_at: '2026-03-03T10:00:00Z',
        reason: 'clear',
        agents_spawned: 0,
        agents_completed: 0,
        modes_used: []
      };

      exportSessionSummary(TEST_DIR, metrics);
      const summaryPath = join(TEST_DIR, '.omc', 'sessions', 'test.json');
      expect(existsSync(summaryPath)).toBe(true);
    });
  });
});

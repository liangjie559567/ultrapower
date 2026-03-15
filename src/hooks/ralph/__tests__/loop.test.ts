import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  readRalphState,
  writeRalphState,
  clearRalphState,
  incrementRalphIteration,
  createRalphLoopHook,
  isUltraQAActive,
  getPrdCompletionStatus,
  setCurrentStory,
  enablePrdMode,
  getRalphContext
} from '../loop.js';
import { createPrd, writePrd } from '../prd.js';

const TEST_DIR = join(process.cwd(), '.test-ralph-loop');

describe('Ralph Loop', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('State Management', () => {
    it('writes and reads state', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test task'
      };

      const written = writeRalphState(TEST_DIR, state);
      expect(written).toBe(true);

      const read = readRalphState(TEST_DIR);
      expect(read).toEqual(state);
    });

    it('returns null for non-existent state', () => {
      const state = readRalphState(TEST_DIR);
      expect(state).toBeNull();
    });

    it('clears state successfully', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test'
      };

      writeRalphState(TEST_DIR, state);
      const cleared = clearRalphState(TEST_DIR);
      expect(cleared).toBe(true);
      expect(readRalphState(TEST_DIR)).toBeNull();
    });
  });

  describe('Iteration Control', () => {
    it('increments iteration', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test'
      };

      writeRalphState(TEST_DIR, state);
      const updated = incrementRalphIteration(TEST_DIR);

      expect(updated).not.toBeNull();
      expect(updated?.iteration).toBe(2);
    });

    it('returns null when no active state', () => {
      const result = incrementRalphIteration(TEST_DIR);
      expect(result).toBeNull();
    });

    it('increments session-scoped iteration', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test',
        session_id: 'test-session'
      };

      writeRalphState(TEST_DIR, state, 'test-session');
      const updated = incrementRalphIteration(TEST_DIR, 'test-session');

      expect(updated?.iteration).toBe(2);
      expect(updated?.session_id).toBe('test-session');
    });

    it('returns null when state inactive', () => {
      const state = {
        active: false,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test'
      };

      writeRalphState(TEST_DIR, state);
      expect(incrementRalphIteration(TEST_DIR)).toBeNull();
    });
  });

  describe('Hook Interface', () => {
    it('starts loop successfully', async () => {
      const hook = createRalphLoopHook(TEST_DIR);
      const started = await hook.startLoop('test-session', 'test task');

      expect(started).toBe(true);

      const state = hook.getState('test-session');
      expect(state?.active).toBe(true);
      expect(state?.prompt).toBe('test task');
    });

    it('prevents start when UltraQA active', async () => {
      // Create fake ultraqa state with session
      const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', 'test-session');
      mkdirSync(sessionDir, { recursive: true });
      const ultraqaPath = join(sessionDir, 'ultraqa-state.json');
      require('fs').writeFileSync(ultraqaPath, JSON.stringify({ active: true }));

      const hook = createRalphLoopHook(TEST_DIR);
      const started = await hook.startLoop('test-session', 'test task');

      expect(started).toBe(false);
    });

    it('cancels loop and clears state', async () => {
      const hook = createRalphLoopHook(TEST_DIR);
      await hook.startLoop('test-session', 'test task');

      const cancelled = hook.cancelLoop('test-session');
      expect(cancelled).toBe(true);
      expect(hook.getState('test-session')).toBeNull();
    });

    it('returns false when cancelling non-existent loop', () => {
      const hook = createRalphLoopHook(TEST_DIR);
      expect(hook.cancelLoop('non-existent')).toBe(false);
    });
  });

  describe('Session-scoped State', () => {
    it('writes and reads session-scoped state', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test',
        session_id: 'test-session'
      };

      writeRalphState(TEST_DIR, state, 'test-session');
      const read = readRalphState(TEST_DIR, 'test-session');

      expect(read).toEqual(state);
    });

    it('returns null for mismatched session id', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test',
        session_id: 'session-a'
      };

      writeRalphState(TEST_DIR, state, 'session-a');
      const read = readRalphState(TEST_DIR, 'session-b');

      expect(read).toBeNull();
    });

    it('clears session-scoped state', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test',
        session_id: 'test-session'
      };

      writeRalphState(TEST_DIR, state, 'test-session');
      clearRalphState(TEST_DIR, 'test-session');

      expect(readRalphState(TEST_DIR, 'test-session')).toBeNull();
    });
  });

  describe('UltraQA Detection', () => {
    it('detects active UltraQA with session', () => {
      const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', 'test-session');
      mkdirSync(sessionDir, { recursive: true });
      const ultraqaPath = join(sessionDir, 'ultraqa-state.json');
      require('fs').writeFileSync(ultraqaPath, JSON.stringify({ active: true }));

      expect(isUltraQAActive(TEST_DIR, 'test-session')).toBe(true);
    });

    it('returns false when UltraQA inactive', () => {
      expect(isUltraQAActive(TEST_DIR, 'test-session')).toBe(false);
    });
  });

  describe('PRD Integration', () => {
    it('detects PRD completion status', () => {
      const prd = createPrd('test', 'feature/test', 'Multi-task feature', [
        { id: 'US-001', title: 'Task 1', description: 'First task', acceptanceCriteria: ['AC1'] },
        { id: 'US-002', title: 'Task 2', description: 'Second task', acceptanceCriteria: ['AC2'] },
        { id: 'US-003', title: 'Task 3', description: 'Third task', acceptanceCriteria: ['AC3'] }
      ]);
      prd.userStories[0].passes = true;
      writePrd(TEST_DIR, prd);

      const status = getPrdCompletionStatus(TEST_DIR);
      expect(status.hasPrd).toBe(true);
      expect(status.allComplete).toBe(false);
      expect(status.status?.total).toBe(3);
      expect(status.status?.completed).toBe(1);
      expect(status.nextStory).not.toBeNull();
    });

    it('returns empty status when no PRD', () => {
      const status = getPrdCompletionStatus(TEST_DIR);
      expect(status.hasPrd).toBe(false);
      expect(status.allComplete).toBe(false);
      expect(status.status).toBeNull();
      expect(status.nextStory).toBeNull();
    });

    it('sets current story in state', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test'
      };
      writeRalphState(TEST_DIR, state);

      const result = setCurrentStory(TEST_DIR, 'US-001');
      expect(result).toBe(true);

      const updated = readRalphState(TEST_DIR);
      expect(updated?.current_story_id).toBe('US-001');
    });

    it('returns false when setting story without state', () => {
      expect(setCurrentStory(TEST_DIR, 'US-001')).toBe(false);
    });

    it('enables PRD mode in state', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test'
      };
      writeRalphState(TEST_DIR, state);

      const result = enablePrdMode(TEST_DIR);
      expect(result).toBe(true);

      const updated = readRalphState(TEST_DIR);
      expect(updated?.prd_mode).toBe(true);
    });

    it('returns false when enabling PRD mode without state', () => {
      expect(enablePrdMode(TEST_DIR)).toBe(false);
    });

    it('gets ralph context with PRD', () => {
      const prd = createPrd('test', 'feature/test', 'Test feature', [
        { id: 'US-001', title: 'Task 1', description: 'First', acceptanceCriteria: ['AC1'] }
      ]);
      writePrd(TEST_DIR, prd);

      const context = getRalphContext(TEST_DIR);
      expect(context).toContain('US-001');
    });

    it('returns empty context without PRD', () => {
      const context = getRalphContext(TEST_DIR);
      expect(context).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('handles corrupted state file gracefully', () => {
      const stateDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      require('fs').writeFileSync(join(stateDir, 'ralph-state.json'), 'invalid json');

      expect(readRalphState(TEST_DIR)).toBeNull();
    });

    it('rejects mismatched session id', () => {
      const state = {
        active: true,
        iteration: 1,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'test',
        session_id: 'session-a'
      };

      writeRalphState(TEST_DIR, state, 'session-a');
      expect(readRalphState(TEST_DIR, 'session-b')).toBeNull();
    });
  });
});

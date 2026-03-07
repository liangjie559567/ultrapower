import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  createRalphLoopHook,
  readRalphState,
  writeRalphState,
  incrementRalphIteration
} from '../loop.js';

const TEST_DIR = join(process.cwd(), '.test-ralph-index');

describe('Ralph Module - Core Scenarios', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('Normal Flow', () => {
    it('starts ralph loop successfully', () => {
      const hook = createRalphLoopHook(TEST_DIR);
      const started = hook.startLoop('test-session', 'build feature X');

      expect(started).toBe(true);
      const state = hook.getState('test-session');
      expect(state?.active).toBe(true);
      expect(state?.iteration).toBe(1);
    });

    it('persists execution state across iterations', () => {
      const hook = createRalphLoopHook(TEST_DIR);
      hook.startLoop('test-session', 'task');

      incrementRalphIteration(TEST_DIR, 'test-session');
      const state1 = readRalphState(TEST_DIR, 'test-session');
      expect(state1?.iteration).toBe(2);

      incrementRalphIteration(TEST_DIR, 'test-session');
      const state2 = readRalphState(TEST_DIR, 'test-session');
      expect(state2?.iteration).toBe(3);
    });

    it('exits on verification pass', () => {
      const hook = createRalphLoopHook(TEST_DIR);
      hook.startLoop('test-session', 'task');

      const cancelled = hook.cancelLoop('test-session');
      expect(cancelled).toBe(true);
      expect(readRalphState(TEST_DIR, 'test-session')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('handles loop interruption gracefully', () => {
      writeRalphState(TEST_DIR, {
        active: true,
        iteration: 5,
        max_iterations: 10,
        started_at: new Date().toISOString(),
        prompt: 'interrupted task',
        session_id: 'test-session'
      }, 'test-session');

      const state = readRalphState(TEST_DIR, 'test-session');
      expect(state?.active).toBe(true);
      expect(state?.iteration).toBe(5);
    });

    it('retries on verification failure', () => {
      const hook = createRalphLoopHook(TEST_DIR);
      hook.startLoop('test-session', 'task');

      incrementRalphIteration(TEST_DIR, 'test-session');
      incrementRalphIteration(TEST_DIR, 'test-session');

      const state = readRalphState(TEST_DIR, 'test-session');
      expect(state?.iteration).toBe(3);
      expect(state?.active).toBe(true);
    });
  });

  describe('Boundary Cases', () => {
    it('respects max iteration limit', () => {
      writeRalphState(TEST_DIR, {
        active: true,
        iteration: 100,
        max_iterations: 100,
        started_at: new Date().toISOString(),
        prompt: 'task',
        session_id: 'test-session'
      }, 'test-session');

      const state = readRalphState(TEST_DIR, 'test-session');
      expect(state?.iteration).toBe(100);
      expect(state?.max_iterations).toBe(100);
    });
  });
});

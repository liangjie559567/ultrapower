import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  readUltraQAState,
  writeUltraQAState,
  clearUltraQAState,
  type UltraQAState
} from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-ultraqa');
const SESSION_ID = 'test-session-qa';

describe('ultraqa state management', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('normal flow', () => {
    it('should write and read state', () => {
      const state: UltraQAState = {
        active: true,
        goal_type: 'tests',
        goal_pattern: null,
        cycle: 1,
        max_cycles: 5,
        failures: [],
        started_at: new Date().toISOString(),
        session_id: SESSION_ID,
        project_path: TEST_DIR
      };

      const written = writeUltraQAState(TEST_DIR, state, SESSION_ID);
      expect(written).toBe(true);

      const read = readUltraQAState(TEST_DIR, SESSION_ID);
      expect(read).not.toBeNull();
      expect(read?.active).toBe(true);
      expect(read?.goal_type).toBe('tests');
      expect(read?.cycle).toBe(1);
    });

    it('should clear state', () => {
      const state: UltraQAState = {
        active: true,
        goal_type: 'build',
        goal_pattern: null,
        cycle: 2,
        max_cycles: 5,
        failures: ['error 1'],
        started_at: new Date().toISOString(),
        session_id: SESSION_ID
      };

      writeUltraQAState(TEST_DIR, state, SESSION_ID);
      const cleared = clearUltraQAState(TEST_DIR, SESSION_ID);
      expect(cleared).toBe(true);

      const read = readUltraQAState(TEST_DIR, SESSION_ID);
      expect(read).toBeNull();
    });
  });

  describe('session isolation', () => {
    it('should prevent cross-session leakage', () => {
      const state1: UltraQAState = {
        active: true,
        goal_type: 'tests',
        goal_pattern: null,
        cycle: 1,
        max_cycles: 5,
        failures: [],
        started_at: new Date().toISOString(),
        session_id: 'session-1'
      };

      const state2: UltraQAState = {
        active: true,
        goal_type: 'lint',
        goal_pattern: null,
        cycle: 2,
        max_cycles: 3,
        failures: ['lint error'],
        started_at: new Date().toISOString(),
        session_id: 'session-2'
      };

      writeUltraQAState(TEST_DIR, state1, 'session-1');
      writeUltraQAState(TEST_DIR, state2, 'session-2');

      const read1 = readUltraQAState(TEST_DIR, 'session-1');
      const read2 = readUltraQAState(TEST_DIR, 'session-2');

      expect(read1?.goal_type).toBe('tests');
      expect(read2?.goal_type).toBe('lint');
      expect(read1?.cycle).toBe(1);
      expect(read2?.cycle).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should return null for non-existent state', () => {
      const state = readUltraQAState(TEST_DIR, SESSION_ID);
      expect(state).toBeNull();
    });

    it('should handle clear on non-existent file', () => {
      const result = clearUltraQAState(TEST_DIR, SESSION_ID);
      expect(result).toBe(true);
    });
  });

  describe('lifecycle operations', () => {
    it('should start ultraqa with default options', async () => {
      const { startUltraQA } = await import('../index.js');
      const result = startUltraQA(TEST_DIR, 'tests', SESSION_ID);

      expect(result.success).toBe(true);
      const state = readUltraQAState(TEST_DIR, SESSION_ID);
      expect(state?.active).toBe(true);
      expect(state?.goal_type).toBe('tests');
      expect(state?.cycle).toBe(1);
      expect(state?.max_cycles).toBe(5);
    });

    it('should record failure and detect repeated failures', async () => {
      const { startUltraQA, recordFailure } = await import('../index.js');
      startUltraQA(TEST_DIR, 'build', SESSION_ID);

      const r1 = recordFailure(TEST_DIR, 'Error: build failed', SESSION_ID);
      expect(r1.shouldExit).toBe(false);

      const r2 = recordFailure(TEST_DIR, 'Error: build failed', SESSION_ID);
      expect(r2.shouldExit).toBe(false);

      const r3 = recordFailure(TEST_DIR, 'Error: build failed', SESSION_ID);
      expect(r3.shouldExit).toBe(true);
      expect(r3.reason).toContain('Same failure detected');
    });

    it('should complete ultraqa successfully', async () => {
      const { startUltraQA, completeUltraQA } = await import('../index.js');
      startUltraQA(TEST_DIR, 'lint', SESSION_ID);

      const result = completeUltraQA(TEST_DIR, SESSION_ID);
      expect(result?.success).toBe(true);
      expect(result?.reason).toBe('goal_met');

      const state = readUltraQAState(TEST_DIR, SESSION_ID);
      expect(state).toBeNull();
    });

    it('should prevent ultraqa when ralph is active', async () => {
      const { startUltraQA } = await import('../index.js');
      const { writeRalphState } = await import('../../ralph/index.js');

      writeRalphState(TEST_DIR, { active: true, iteration: 1, max_iterations: 10, started_at: new Date().toISOString(), session_id: SESSION_ID }, SESSION_ID);

      const result = startUltraQA(TEST_DIR, 'tests', SESSION_ID);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Ralph Loop is active');
    });
  });
});

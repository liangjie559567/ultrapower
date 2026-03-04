import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  readUltraworkState,
  writeUltraworkState,
  activateUltrawork,
  deactivateUltrawork,
  incrementReinforcement,
  shouldReinforceUltrawork,
  getUltraworkPersistenceMessage,
  createUltraworkStateHook,
  type UltraworkState
} from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-ultrawork');
const SESSION_ID = 'test-session-123';

describe('ultrawork state management', () => {
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
    it('should activate ultrawork and persist state', () => {
      const result = activateUltrawork('test task', SESSION_ID, TEST_DIR);
      expect(result).toBe(true);

      const state = readUltraworkState(TEST_DIR, SESSION_ID);
      expect(state).not.toBeNull();
      expect(state?.active).toBe(true);
      expect(state?.original_prompt).toBe('test task');
      expect(state?.session_id).toBe(SESSION_ID);
      expect(state?.reinforcement_count).toBe(0);
    });

    it('should deactivate ultrawork and remove state', () => {
      activateUltrawork('test task', SESSION_ID, TEST_DIR);
      const result = deactivateUltrawork(TEST_DIR, SESSION_ID);
      expect(result).toBe(true);

      const state = readUltraworkState(TEST_DIR, SESSION_ID);
      expect(state).toBeNull();
    });

    it('should increment reinforcement count', () => {
      activateUltrawork('test task', SESSION_ID, TEST_DIR);
      const updated = incrementReinforcement(TEST_DIR, SESSION_ID);

      expect(updated).not.toBeNull();
      expect(updated?.reinforcement_count).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should return null for non-existent state', () => {
      const state = readUltraworkState(TEST_DIR, SESSION_ID);
      expect(state).toBeNull();
    });

    it('should return null for corrupted state file', () => {
      const stateDir = join(TEST_DIR, '.omc', 'state', 'sessions', SESSION_ID);
      mkdirSync(stateDir, { recursive: true });
      const stateFile = join(stateDir, 'ultrawork-state.json');
      writeFileSync(stateFile, 'invalid json{{{');

      const state = readUltraworkState(TEST_DIR, SESSION_ID);
      expect(state).toBeNull();
    });

    it('should return null when incrementing inactive state', () => {
      const result = incrementReinforcement(TEST_DIR, SESSION_ID);
      expect(result).toBeNull();
    });
  });

  describe('session isolation', () => {
    it('should prevent cross-session state leakage', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      activateUltrawork('task 1', session1, TEST_DIR);
      activateUltrawork('task 2', session2, TEST_DIR);

      const state1 = readUltraworkState(TEST_DIR, session1);
      const state2 = readUltraworkState(TEST_DIR, session2);

      expect(state1?.original_prompt).toBe('task 1');
      expect(state2?.original_prompt).toBe('task 2');
      expect(state1?.session_id).toBe(session1);
      expect(state2?.session_id).toBe(session2);
    });

    it('should reject state with mismatched session_id', () => {
      const state: UltraworkState = {
        active: true,
        started_at: new Date().toISOString(),
        original_prompt: 'test',
        session_id: 'wrong-session',
        reinforcement_count: 0,
        last_checked_at: new Date().toISOString()
      };

      writeUltraworkState(state, TEST_DIR, SESSION_ID);
      const read = readUltraworkState(TEST_DIR, SESSION_ID);
      expect(read).toBeNull();
    });

    it('should enforce strict session isolation in shouldReinforceUltrawork', () => {
      activateUltrawork('test', SESSION_ID, TEST_DIR);

      expect(shouldReinforceUltrawork(SESSION_ID, TEST_DIR)).toBe(true);
      expect(shouldReinforceUltrawork('other-session', TEST_DIR)).toBe(false);
      expect(shouldReinforceUltrawork(undefined, TEST_DIR)).toBe(false);
    });
  });

  describe('legacy path fallback', () => {
    it('should read legacy state when no sessionId provided', () => {
      const legacyState: UltraworkState = {
        active: true,
        started_at: new Date().toISOString(),
        original_prompt: 'legacy task',
        reinforcement_count: 0,
        last_checked_at: new Date().toISOString()
      };

      const legacyDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(legacyDir, { recursive: true });
      writeFileSync(
        join(legacyDir, 'ultrawork-state.json'),
        JSON.stringify(legacyState)
      );

      const state = readUltraworkState(TEST_DIR);
      expect(state?.original_prompt).toBe('legacy task');
    });

    it('should clean up ghost legacy files on deactivate', () => {
      const legacyDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(legacyDir, { recursive: true });
      const legacyFile = join(legacyDir, 'ultrawork-state.json');

      const legacyState: UltraworkState = {
        active: true,
        started_at: new Date().toISOString(),
        original_prompt: 'legacy',
        session_id: SESSION_ID,
        reinforcement_count: 0,
        last_checked_at: new Date().toISOString()
      };
      writeFileSync(legacyFile, JSON.stringify(legacyState));

      activateUltrawork('test', SESSION_ID, TEST_DIR);
      deactivateUltrawork(TEST_DIR, SESSION_ID);

      expect(existsSync(legacyFile)).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should generate persistence message', () => {
      const state: UltraworkState = {
        active: true,
        started_at: new Date().toISOString(),
        original_prompt: 'test task',
        reinforcement_count: 2,
        last_checked_at: new Date().toISOString()
      };

      const message = getUltraworkPersistenceMessage(state);
      expect(message).toContain('Reinforcement #3');
      expect(message).toContain('test task');
      expect(message).toContain('PARALLEL');
    });

    it('should create hook instance with bound methods', () => {
      const hook = createUltraworkStateHook(TEST_DIR);

      hook.activate('test', SESSION_ID);
      expect(hook.getState(SESSION_ID)?.active).toBe(true);

      hook.deactivate(SESSION_ID);
      expect(hook.getState(SESSION_ID)).toBeNull();
    });
  });

  describe('ralph linkage', () => {
    it('should track ralph linkage in state', () => {
      activateUltrawork('test', SESSION_ID, TEST_DIR, true);
      const state = readUltraworkState(TEST_DIR, SESSION_ID);
      expect(state?.linked_to_ralph).toBe(true);
    });
  });
});

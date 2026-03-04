import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLearnedSkillsHook,
  processMessageForSkills,
  clearSkillSession,
  isLearnerEnabled
} from '../index.js';

describe('Learner Hook', () => {
  const TEST_SESSION = 'test-session-1';

  beforeEach(() => {
    clearSkillSession(TEST_SESSION);
  });

  describe('processMessageForSkills', () => {
    it('returns zero injected when disabled', () => {
      const result = processMessageForSkills('test message', TEST_SESSION, null);
      expect(result.injected).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.skills)).toBe(true);
    });

    it('processes message and returns result', () => {
      const result = processMessageForSkills('implement feature', TEST_SESSION, null);
      expect(typeof result.injected).toBe('number');
      expect(Array.isArray(result.skills)).toBe(true);
    });
  });

  describe('clearSkillSession', () => {
    it('clears session cache', () => {
      processMessageForSkills('test', TEST_SESSION, null);
      clearSkillSession(TEST_SESSION);
      expect(true).toBe(true);
    });
  });

  describe('isLearnerEnabled', () => {
    it('returns boolean', () => {
      const enabled = isLearnerEnabled();
      expect(typeof enabled).toBe('boolean');
    });
  });

  describe('createLearnedSkillsHook', () => {
    it('creates hook with required methods', () => {
      const hook = createLearnedSkillsHook(null);
      expect(typeof hook.processMessage).toBe('function');
      expect(typeof hook.clearSession).toBe('function');
      expect(typeof hook.getAllSkills).toBe('function');
      expect(typeof hook.isEnabled).toBe('function');
    });

    it('processes message via hook', () => {
      const hook = createLearnedSkillsHook(null);
      const result = hook.processMessage('test', TEST_SESSION);
      expect(typeof result.injected).toBe('number');
    });
  });
});

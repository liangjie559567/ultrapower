import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  getExpectedSignalForPhase,
  checkAutopilot
} from '../enforcement.js';
import { initAutopilot, writeAutopilotState } from '../state.js';

const TEST_DIR = join(process.cwd(), '.test-autopilot-enforcement');
const TEST_SESSION = 'test-session-enforcement';

describe('Autopilot Enforcement', () => {
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

  describe('getExpectedSignalForPhase', () => {
    it('should return correct signal for expansion phase', () => {
      expect(getExpectedSignalForPhase('expansion')).toBe('EXPANSION_COMPLETE');
    });

    it('should return correct signal for planning phase', () => {
      expect(getExpectedSignalForPhase('planning')).toBe('PLANNING_COMPLETE');
    });

    it('should return correct signal for execution phase', () => {
      expect(getExpectedSignalForPhase('execution')).toBe('EXECUTION_COMPLETE');
    });

    it('should return correct signal for qa phase', () => {
      expect(getExpectedSignalForPhase('qa')).toBe('QA_COMPLETE');
    });

    it('should return correct signal for validation phase', () => {
      expect(getExpectedSignalForPhase('validation')).toBe('VALIDATION_COMPLETE');
    });

    it('should return null for unknown phase', () => {
      expect(getExpectedSignalForPhase('unknown')).toBe(null);
    });
  });

  describe('checkAutopilot', () => {
    it('should return null when no active state', async () => {
      const result = await checkAutopilot(TEST_SESSION, TEST_DIR);
      expect(result).toBe(null);
    });

    it('should return null when session mismatch', async () => {
      initAutopilot(TEST_DIR, 'test idea', 'different-session');
      const result = await checkAutopilot(TEST_SESSION, TEST_DIR);
      expect(result).toBe(null);
    });

    it('should stop at max iterations', async () => {
      const state = initAutopilot(TEST_DIR, 'test', TEST_SESSION, { maxIterations: 1 });
      if (state) {
        state.iteration = 1;
        writeAutopilotState(TEST_DIR, state, TEST_SESSION);
      }

      const result = await checkAutopilot(TEST_SESSION, TEST_DIR);
      expect(result?.shouldBlock).toBe(false);
      expect(result?.phase).toBe('failed');
    });

    it('should return complete when phase is complete', async () => {
      const state = initAutopilot(TEST_DIR, 'test', TEST_SESSION);
      if (state) {
        state.phase = 'complete';
        // Keep active=true so checkAutopilot processes it
        writeAutopilotState(TEST_DIR, state, TEST_SESSION);
      }

      const result = await checkAutopilot(TEST_SESSION, TEST_DIR);
      expect(result?.phase).toBe('complete');
      expect(result?.shouldBlock).toBe(false);
      expect(result?.message).toContain('COMPLETE');
    });

    it('should return failed when phase is failed', async () => {
      const state = initAutopilot(TEST_DIR, 'test', TEST_SESSION);
      if (state) {
        state.phase = 'failed';
        // Keep active=true so checkAutopilot processes it
        writeAutopilotState(TEST_DIR, state, TEST_SESSION);
      }

      const result = await checkAutopilot(TEST_SESSION, TEST_DIR);
      expect(result?.phase).toBe('failed');
      expect(result?.shouldBlock).toBe(false);
    });

    it('should generate continuation prompt', async () => {
      initAutopilot(TEST_DIR, 'test idea', TEST_SESSION);
      const result = await checkAutopilot(TEST_SESSION, TEST_DIR);

      expect(result?.shouldBlock).toBe(true);
      expect(result?.message).toContain('AUTOPILOT');
      expect(result?.metadata?.iteration).toBe(2);
    });

    it('should include phase in continuation prompt', async () => {
      initAutopilot(TEST_DIR, 'test idea', TEST_SESSION);
      const result = await checkAutopilot(TEST_SESSION, TEST_DIR);

      expect(result?.phase).toBe('expansion');
      expect(result?.message).toContain('EXPANSION');
    });

    it('should track iteration count', async () => {
      const state = initAutopilot(TEST_DIR, 'test', TEST_SESSION);
      if (state) {
        state.iteration = 3;
        writeAutopilotState(TEST_DIR, state, TEST_SESSION);
      }

      const result = await checkAutopilot(TEST_SESSION, TEST_DIR);
      expect(result?.metadata?.iteration).toBe(4);
    });
  });
});

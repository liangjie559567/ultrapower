import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, utimesSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  cancelAutopilot,
  clearAutopilot,
  canResumeAutopilot,
  resumeAutopilot,
  formatCancelMessage,
  formatFailureSummary,
  STALE_STATE_MAX_AGE_MS,
  type CancelResult
} from '../cancel.js';
import {
  initAutopilot,
  transitionPhase,
  readAutopilotState,
  writeAutopilotState,
  updateExecution,
  appendCompletedStep,
  recordFailureReason
} from '../state.js';

// Mock the ralph and ultraqa modules
vi.mock('../../ralph/index.js', () => ({
  clearRalphState: vi.fn(() => true),
  clearLinkedUltraworkState: vi.fn(() => true),
  readRalphState: vi.fn(() => null)
}));

vi.mock('../../ultraqa/index.js', () => ({
  clearUltraQAState: vi.fn(() => true),
  readUltraQAState: vi.fn(() => null)
}));

// Import mocked functions after vi.mock
import * as ralphLoop from '../../ralph/index.js';
import * as ultraqaLoop from '../../ultraqa/index.js';

describe('AutopilotCancel', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'autopilot-cancel-test-'));
    const fs = require('fs');
    fs.mkdirSync(join(testDir, '.omc', 'state'), { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('cancelAutopilot', () => {
    it('should return failure when no state exists', () => {
      const result = cancelAutopilot(testDir);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No active autopilot session found');
      expect(result.preservedState).toBeUndefined();
    });

    it('should return failure when state exists but is not active', () => {
      const state = initAutopilot(testDir, 'test idea');
      if (state) {
        state.active = false;
        const stateFile = join(testDir, '.omc', 'state', 'autopilot-state.json');
        const fs = require('fs');
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
      }

      const result = cancelAutopilot(testDir);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Autopilot is not currently active');
      expect(result.preservedState).toBeUndefined();
    });

    it('should successfully cancel active autopilot and preserve state', () => {
      initAutopilot(testDir, 'test idea');

      const result = cancelAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Autopilot cancelled at phase: expansion');
      expect(result.message).toContain('Progress preserved for resume');
      expect(result.preservedState).toBeDefined();
      expect(result.preservedState?.active).toBe(false);
      expect(result.preservedState?.originalIdea).toBe('test idea');
    });

    it('should preserve state at different phases', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'planning');

      const result = cancelAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Autopilot cancelled at phase: planning');
      expect(result.preservedState?.phase).toBe('planning');
    });

    it('should clean up ralph state when active', () => {
      initAutopilot(testDir, 'test idea');

      // Mock active ralph state
      vi.mocked(ralphLoop.readRalphState).mockReturnValueOnce({
        active: true,
        linked_ultrawork: false
      } as any);

      const result = cancelAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Cleaned up: ralph');
      expect(ralphLoop.clearRalphState).toHaveBeenCalledWith(testDir);
    });

    it('should clean up ralph and ultrawork when linked', () => {
      initAutopilot(testDir, 'test idea');

      // Mock active ralph state with linked ultrawork
      vi.mocked(ralphLoop.readRalphState).mockReturnValueOnce({
        active: true,
        linked_ultrawork: true
      } as any);

      const result = cancelAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Cleaned up: ultrawork, ralph');
      expect(ralphLoop.clearLinkedUltraworkState).toHaveBeenCalledWith(testDir);
      expect(ralphLoop.clearRalphState).toHaveBeenCalledWith(testDir);
    });

    it('should clean up ultraqa state when active', () => {
      initAutopilot(testDir, 'test idea');

      // Mock active ultraqa state
      vi.mocked(ultraqaLoop.readUltraQAState).mockReturnValueOnce({
        active: true
      } as any);

      const result = cancelAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Cleaned up: ultraqa');
      expect(ultraqaLoop.clearUltraQAState).toHaveBeenCalledWith(testDir);
    });

    it('should clean up all states when all are active', () => {
      initAutopilot(testDir, 'test idea');

      // Mock all states active
      vi.mocked(ralphLoop.readRalphState).mockReturnValueOnce({
        active: true,
        linked_ultrawork: true
      } as any);
      vi.mocked(ultraqaLoop.readUltraQAState).mockReturnValueOnce({
        active: true
      } as any);

      const result = cancelAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Cleaned up: ultrawork, ralph, ultraqa');
      expect(ralphLoop.clearLinkedUltraworkState).toHaveBeenCalledWith(testDir);
      expect(ralphLoop.clearRalphState).toHaveBeenCalledWith(testDir);
      expect(ultraqaLoop.clearUltraQAState).toHaveBeenCalledWith(testDir);
    });

    it('should mark autopilot as inactive but keep state on disk', () => {
      initAutopilot(testDir, 'test idea');

      cancelAutopilot(testDir);

      const state = readAutopilotState(testDir);
      expect(state).not.toBeNull();
      expect(state?.active).toBe(false);
      expect(state?.originalIdea).toBe('test idea');
    });

    it('should not clear other session ralph/ultraqa state when sessionId provided', () => {
      const sessionId = 'session-a';
      initAutopilot(testDir, 'test idea', sessionId);

      vi.mocked(ralphLoop.readRalphState).mockReturnValueOnce(null as any);
      vi.mocked(ultraqaLoop.readUltraQAState).mockReturnValueOnce(null as any);

      cancelAutopilot(testDir, sessionId);

      expect(ralphLoop.readRalphState).toHaveBeenCalledWith(testDir, sessionId);
      expect(ultraqaLoop.readUltraQAState).toHaveBeenCalledWith(testDir, sessionId);
      expect(ralphLoop.clearRalphState).not.toHaveBeenCalled();
      expect(ralphLoop.clearLinkedUltraworkState).not.toHaveBeenCalled();
      expect(ultraqaLoop.clearUltraQAState).not.toHaveBeenCalled();
    });
  });

  describe('clearAutopilot', () => {
    it('should return success when no state exists', () => {
      const result = clearAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No autopilot state to clear');
    });

    it('should clear all autopilot state completely', () => {
      initAutopilot(testDir, 'test idea');

      const result = clearAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Autopilot state cleared completely');

      const state = readAutopilotState(testDir);
      expect(state).toBeNull();
    });

    it('should clear ralph state when present', () => {
      initAutopilot(testDir, 'test idea');

      // Mock ralph state exists
      vi.mocked(ralphLoop.readRalphState).mockReturnValueOnce({
        active: true,
        linked_ultrawork: false
      } as any);

      clearAutopilot(testDir);

      expect(ralphLoop.clearRalphState).toHaveBeenCalledWith(testDir);
    });

    it('should clear ralph and linked ultrawork state when present', () => {
      initAutopilot(testDir, 'test idea');

      // Mock ralph state with linked ultrawork
      vi.mocked(ralphLoop.readRalphState).mockReturnValueOnce({
        active: false,
        linked_ultrawork: true
      } as any);

      clearAutopilot(testDir);

      expect(ralphLoop.clearLinkedUltraworkState).toHaveBeenCalledWith(testDir);
      expect(ralphLoop.clearRalphState).toHaveBeenCalledWith(testDir);
    });

    it('should clear ultraqa state when present', () => {
      initAutopilot(testDir, 'test idea');

      // Mock ultraqa state exists
      vi.mocked(ultraqaLoop.readUltraQAState).mockReturnValueOnce({
        active: false
      } as any);

      clearAutopilot(testDir);

      expect(ultraqaLoop.clearUltraQAState).toHaveBeenCalledWith(testDir);
    });

    it('should clear all states when all are present', () => {
      initAutopilot(testDir, 'test idea');

      // Mock all states exist
      vi.mocked(ralphLoop.readRalphState).mockReturnValueOnce({
        active: true,
        linked_ultrawork: true
      } as any);
      vi.mocked(ultraqaLoop.readUltraQAState).mockReturnValueOnce({
        active: true
      } as any);

      clearAutopilot(testDir);

      expect(ralphLoop.clearLinkedUltraworkState).toHaveBeenCalledWith(testDir);
      expect(ralphLoop.clearRalphState).toHaveBeenCalledWith(testDir);
      expect(ultraqaLoop.clearUltraQAState).toHaveBeenCalledWith(testDir);

      const state = readAutopilotState(testDir);
      expect(state).toBeNull();
    });

    it('should not clear other session ralph/ultraqa state when sessionId provided', () => {
      const sessionId = 'session-a';
      initAutopilot(testDir, 'test idea', sessionId);

      vi.mocked(ralphLoop.readRalphState).mockReturnValueOnce(null as any);
      vi.mocked(ultraqaLoop.readUltraQAState).mockReturnValueOnce(null as any);

      clearAutopilot(testDir, sessionId);

      expect(ralphLoop.readRalphState).toHaveBeenCalledWith(testDir, sessionId);
      expect(ultraqaLoop.readUltraQAState).toHaveBeenCalledWith(testDir, sessionId);
      expect(ralphLoop.clearRalphState).not.toHaveBeenCalled();
      expect(ralphLoop.clearLinkedUltraworkState).not.toHaveBeenCalled();
      expect(ultraqaLoop.clearUltraQAState).not.toHaveBeenCalled();
    });
  });

  describe('canResumeAutopilot', () => {
    it('should return false when no state exists', () => {
      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(false);
      expect(result.state).toBeUndefined();
      expect(result.resumePhase).toBeUndefined();
    });

    it('should return true for recently cancelled incomplete state', () => {
      initAutopilot(testDir, 'test idea');
      cancelAutopilot(testDir);

      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(true);
      expect(result.state).toBeDefined();
      expect(result.resumePhase).toBe('expansion');
    });

    it('should return true for recently cancelled planning state', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'planning');
      cancelAutopilot(testDir);

      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(true);
      expect(result.resumePhase).toBe('planning');
    });

    it('should return false for complete phase', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'complete');

      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(false);
      expect(result.state).toBeDefined();
      expect(result.state?.phase).toBe('complete');
    });

    it('should return false for failed phase', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'failed');

      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(false);
      expect(result.state).toBeDefined();
      expect(result.state?.phase).toBe('failed');
    });

    it('should return false for state that is still active (issue #609)', () => {
      initAutopilot(testDir, 'test idea');
      // State is active: true — do NOT cancel, simulate another session seeing this

      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(false);
      expect(result.state).toBeDefined();
      expect(result.state?.active).toBe(true);
    });

    it('should return false for stale cancelled state older than 1 hour (issue #609)', () => {
      initAutopilot(testDir, 'test idea');
      cancelAutopilot(testDir);

      // Age the state file to be older than the stale threshold
      const stateFile = join(testDir, '.omc', 'state', 'autopilot-state.json');
      const pastTime = new Date(Date.now() - STALE_STATE_MAX_AGE_MS - 60_000);
      utimesSync(stateFile, pastTime, pastTime);

      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(false);
    });

    it('should auto-cleanup stale state file (issue #609)', () => {
      initAutopilot(testDir, 'test idea');
      cancelAutopilot(testDir);

      // Age the state file
      const stateFile = join(testDir, '.omc', 'state', 'autopilot-state.json');
      const pastTime = new Date(Date.now() - STALE_STATE_MAX_AGE_MS - 60_000);
      utimesSync(stateFile, pastTime, pastTime);

      canResumeAutopilot(testDir);

      // State file should be deleted after stale detection
      const state = readAutopilotState(testDir);
      expect(state).toBeNull();
    });

    it('should allow resume for recently cancelled state within 1 hour', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'execution');
      cancelAutopilot(testDir);

      // File is fresh — well within the 1 hour window
      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(true);
      expect(result.resumePhase).toBe('execution');
    });
  });

  describe('resumeAutopilot', () => {
    it('should return failure when no state exists', () => {
      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No autopilot session available to resume');
      expect(result.state).toBeUndefined();
    });

    it('should return failure when state is complete', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'complete');

      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No autopilot session available to resume');
    });

    it('should return failure when state is failed', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'failed');

      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No autopilot session available to resume');
    });

    it('should successfully resume from expansion phase', () => {
      initAutopilot(testDir, 'test idea');
      cancelAutopilot(testDir); // Cancel to make it inactive

      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Resuming autopilot at phase: expansion');
      expect(result.state).toBeDefined();
      expect(result.state?.active).toBe(true);
      expect(result.state?.iteration).toBe(2);
    });

    it('should successfully resume from planning phase', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'planning');
      cancelAutopilot(testDir);

      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Resuming autopilot at phase: planning');
      expect(result.state?.phase).toBe('planning');
      expect(result.state?.active).toBe(true);
    });

    it('should increment iteration on resume', () => {
      initAutopilot(testDir, 'test idea');

      let state = readAutopilotState(testDir);
      const initialIteration = state?.iteration ?? 0;

      cancelAutopilot(testDir);
      resumeAutopilot(testDir);

      state = readAutopilotState(testDir);
      expect(state?.iteration).toBe(initialIteration + 1);
    });

    it('should re-activate state on resume', () => {
      initAutopilot(testDir, 'test idea');
      cancelAutopilot(testDir);

      let state = readAutopilotState(testDir);
      expect(state?.active).toBe(false);

      resumeAutopilot(testDir);

      state = readAutopilotState(testDir);
      expect(state?.active).toBe(true);
    });

    it('should preserve all state data on resume', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'execution');
      updateExecution(testDir, {
        files_created: ['file1.ts', 'file2.ts'],
        files_modified: ['file3.ts'],
        tasks_completed: 5,
        tasks_total: 10
      });

      cancelAutopilot(testDir);
      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.state?.execution.files_created).toEqual(['file1.ts', 'file2.ts']);
      expect(result.state?.execution.files_modified).toEqual(['file3.ts']);
      expect(result.state?.execution.tasks_completed).toBe(5);
      expect(result.state?.execution.tasks_total).toBe(10);
    });

    it('should refuse to resume stale state from a previous session (issue #609)', () => {
      initAutopilot(testDir, 'old idea from session A');
      transitionPhase(testDir, 'planning');
      cancelAutopilot(testDir);

      // Simulate passage of time — file is now older than 1 hour
      const stateFile = join(testDir, '.omc', 'state', 'autopilot-state.json');
      const pastTime = new Date(Date.now() - STALE_STATE_MAX_AGE_MS - 60_000);
      utimesSync(stateFile, pastTime, pastTime);

      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No autopilot session available to resume');
    });

    it('should refuse to resume actively-running state (issue #609)', () => {
      initAutopilot(testDir, 'test idea');
      // Do NOT cancel — state is still active: true

      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No autopilot session available to resume');
    });

    it('should resume interrupted state (active=true but older than 5 min)', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'execution');
      // Simulate crash: state is still active=true but file is old

      const stateFile = join(testDir, '.omc', 'state', 'autopilot-state.json');
      const pastTime = new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago
      utimesSync(stateFile, pastTime, pastTime);

      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.state?.was_interrupted).toBe(true);
      expect(result.state?.resumed_at).toBeDefined();
      expect(result.state?.active).toBe(true);
    });

    it('should set was_interrupted and resumed_at on interrupted resume', () => {
      initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'qa');

      const stateFile = join(testDir, '.omc', 'state', 'autopilot-state.json');
      const pastTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      utimesSync(stateFile, pastTime, pastTime);

      const result = resumeAutopilot(testDir);

      expect(result.success).toBe(true);
      expect(result.state?.was_interrupted).toBe(true);
      expect(result.state?.resumed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.message).toContain('qa');
    });
  });

  describe('formatCancelMessage', () => {
    it('should format failure message', () => {
      const result: CancelResult = {
        success: false,
        message: 'No active autopilot session found'
      };

      const formatted = formatCancelMessage(result);

      expect(formatted).toBe('[AUTOPILOT] No active autopilot session found');
    });

    it('should format success message without preserved state', () => {
      const result: CancelResult = {
        success: true,
        message: 'Autopilot state cleared completely'
      };

      const formatted = formatCancelMessage(result);

      expect(formatted).toContain('[AUTOPILOT CANCELLED]');
      expect(formatted).toContain('Autopilot state cleared completely');
      expect(formatted).not.toContain('Progress Summary');
    });

    it('should format success message with preserved state and progress summary', () => {
      const _state = initAutopilot(testDir, 'test idea');
      transitionPhase(testDir, 'execution');
      updateExecution(testDir, {
        files_created: ['file1.ts', 'file2.ts', 'file3.ts'],
        files_modified: ['file4.ts', 'file5.ts']
      });

      const updatedState = readAutopilotState(testDir);
      if (updatedState) {
        updatedState.total_agents_spawned = 7;
      }

      const result: CancelResult = {
        success: true,
        message: 'Autopilot cancelled at phase: execution. Progress preserved for resume.',
        preservedState: updatedState!
      };

      const formatted = formatCancelMessage(result);

      expect(formatted).toContain('[AUTOPILOT CANCELLED]');
      expect(formatted).toContain('Autopilot cancelled at phase: execution');
      expect(formatted).toContain('Progress Summary:');
      expect(formatted).toContain('- Phase reached: execution');
      expect(formatted).toContain('- Files created: 3');
      expect(formatted).toContain('- Files modified: 2');
      expect(formatted).toContain('- Agents used: 7');
      expect(formatted).toContain('Run /autopilot to resume from where you left off.');
    });

    it('should handle zero progress in summary', () => {
      const state = initAutopilot(testDir, 'test idea');
      if (!state) {
        throw new Error('Failed to initialize autopilot');
      }

      const result: CancelResult = {
        success: true,
        message: 'Autopilot cancelled at phase: expansion. Progress preserved for resume.',
        preservedState: state
      };

      const formatted = formatCancelMessage(result);

      expect(formatted).toContain('- Files created: 0');
      expect(formatted).toContain('- Files modified: 0');
      expect(formatted).toContain('- Agents used: 0');
    });

    it('should handle cleanup message in preserved state format', () => {
      const state = initAutopilot(testDir, 'test idea');
      if (!state) {
        throw new Error('Failed to initialize autopilot');
      }
      state.active = false;

      const result: CancelResult = {
        success: true,
        message: 'Autopilot cancelled at phase: expansion. Cleaned up: ralph, ultrawork. Progress preserved for resume.',
        preservedState: state
      };

      const formatted = formatCancelMessage(result);

      expect(formatted).toContain('[AUTOPILOT CANCELLED]');
      expect(formatted).toContain('Cleaned up: ralph, ultrawork');
      expect(formatted).toContain('Progress Summary:');
    });
  });

  describe('formatFailureSummary', () => {
    it('should show completed steps with checkmarks', () => {
      const state = initAutopilot(testDir, 'test idea');
      if (!state) throw new Error('Failed to init');
      state.phase = 'execution';
      state.completed_steps = ['expansion', 'planning'];
      state.failure_reason = 'Ralph state clear failed';

      const output = formatFailureSummary(state);

      expect(output).toContain('✓ expansion');
      expect(output).toContain('✓ planning');
      expect(output).toContain('✗ execution');
      expect(output).toContain('Ralph state clear failed');
      expect(output).toContain('/autopilot');
    });

    it('should handle no completed steps', () => {
      const state = initAutopilot(testDir, 'test idea');
      if (!state) throw new Error('Failed to init');
      state.phase = 'expansion';
      state.completed_steps = [];

      const output = formatFailureSummary(state);

      expect(output).toContain('✗ expansion');
      expect(output).not.toContain('✓');
    });

    it('should not show phases beyond failure point', () => {
      const state = initAutopilot(testDir, 'test idea');
      if (!state) throw new Error('Failed to init');
      state.phase = 'planning';
      state.completed_steps = ['expansion'];

      const output = formatFailureSummary(state);

      expect(output).toContain('✓ expansion');
      expect(output).toContain('✗ planning');
      expect(output).not.toContain('execution');
    });
  });

  describe('appendCompletedStep', () => {
    it('should append a step to completed_steps', () => {
      initAutopilot(testDir, 'test idea');
      appendCompletedStep(testDir, 'expansion');

      const state = readAutopilotState(testDir);
      expect(state?.completed_steps).toContain('expansion');
    });

    it('should accumulate multiple steps', () => {
      initAutopilot(testDir, 'test idea');
      appendCompletedStep(testDir, 'expansion');
      appendCompletedStep(testDir, 'planning');

      const state = readAutopilotState(testDir);
      expect(state?.completed_steps).toEqual(['expansion', 'planning']);
    });

    it('should return false when no state exists', () => {
      const result = appendCompletedStep(testDir, 'expansion');
      expect(result).toBe(false);
    });
  });

  describe('recordFailureReason', () => {
    it('should record failure reason in state', () => {
      initAutopilot(testDir, 'test idea');
      recordFailureReason(testDir, 'Build failed: tsc error');

      const state = readAutopilotState(testDir);
      expect(state?.failure_reason).toBe('Build failed: tsc error');
    });

    it('should return false when no state exists', () => {
      const result = recordFailureReason(testDir, 'some error');
      expect(result).toBe(false);
    });
  });

  describe('review fixes', () => {
    it('canResumeAutopilot: stale cleanup should not return state', () => {
      initAutopilot(testDir, 'test idea');
      cancelAutopilot(testDir);

      const stateFile = join(testDir, '.omc', 'state', 'autopilot-state.json');
      const pastTime = new Date(Date.now() - STALE_STATE_MAX_AGE_MS - 60_000);
      utimesSync(stateFile, pastTime, pastTime);

      const result = canResumeAutopilot(testDir);

      expect(result.canResume).toBe(false);
      expect(result.state).toBeUndefined();
    });

    it('appendCompletedStep: deduplicates repeated steps', () => {
      initAutopilot(testDir, 'test idea');
      appendCompletedStep(testDir, 'expansion');
      appendCompletedStep(testDir, 'expansion'); // duplicate

      const state = readAutopilotState(testDir);
      expect(state?.completed_steps?.filter(s => s === 'expansion').length).toBe(1);
    });

    it('resumeAutopilot: refuses when max_iterations reached', () => {
      const state = initAutopilot(testDir, 'test idea');
      if (!state) throw new Error('Failed to init');
      cancelAutopilot(testDir);

      // Set iteration to max
      const s = readAutopilotState(testDir)!;
      s.iteration = s.max_iterations;
      writeAutopilotState(testDir, s);

      const result = resumeAutopilot(testDir);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Max iterations');
    });

    it('formatFailureSummary: shows failure phase even when intermediate phases skipped', () => {
      const state = initAutopilot(testDir, 'test idea');
      if (!state) throw new Error('Failed to init');
      // expansion done, planning skipped (e.g. skipQa scenario analog), failed at qa
      state.phase = 'qa';
      state.completed_steps = ['expansion'];

      const output = formatFailureSummary(state);

      expect(output).toContain('✓ expansion');
      expect(output).toContain('✗ qa');
    });
  });
});

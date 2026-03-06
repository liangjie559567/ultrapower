import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  initTeamPipelineState,
  readTeamPipelineState,
  writeTeamPipelineState,
  clearTeamPipelineState,
} from '../state.js';
import { transitionTeamPhase, requestTeamCancel } from '../transitions.js';
import type { TeamPipelineState } from '../types.js';

describe('Team Pipeline Integration Tests', () => {
  let testDir: string;
  const sessionId = 'test-session-123';

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'team-pipeline-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  // ============================================================================
  // 1. plan → prd 转换（正常 + 异常恢复）
  // ============================================================================

  describe('plan → prd transition', () => {
    it('succeeds with normal flow', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      expect(state.phase).toBe('team-plan');

      const result = transitionTeamPhase(state, 'team-prd', 'planning-complete');
      expect(result.ok).toBe(true);
      expect(result.state.phase).toBe('team-prd');
      expect(result.state.phase_history).toHaveLength(2);
      expect(result.state.phase_history[1].reason).toBe('planning-complete');
    });

    it('recovers from corrupted state by reinitializing', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      writeTeamPipelineState(testDir, state, sessionId);

      // Simulate corruption
      const corrupted = { ...state, phase: 'invalid-phase' as any };
      writeTeamPipelineState(testDir, corrupted, sessionId);

      const read = readTeamPipelineState(testDir, sessionId);
      expect(read).not.toBeNull();

      // Recovery: reinitialize from plan
      const recovered = initTeamPipelineState(testDir, sessionId);
      expect(recovered.phase).toBe('team-plan');
    });
  });

  // ============================================================================
  // 2. prd → exec 转换（验收标准验证）
  // ============================================================================

  describe('prd → exec transition', () => {
    it('requires plan_path or prd_path artifact', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const prdState = transitionTeamPhase(state, 'team-prd').state;

      const result = transitionTeamPhase(prdState, 'team-exec');
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('requires plan_path or prd_path');
    });

    it('succeeds when plan_path is set', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const prdState = transitionTeamPhase(state, 'team-prd').state;

      const withPlan = {
        ...prdState,
        artifacts: { ...prdState.artifacts, plan_path: '.omc/plans/team.md' },
      };

      const result = transitionTeamPhase(withPlan, 'team-exec');
      expect(result.ok).toBe(true);
      expect(result.state.phase).toBe('team-exec');
    });

    it('succeeds when prd_path is set', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const prdState = transitionTeamPhase(state, 'team-prd').state;

      const withPrd = {
        ...prdState,
        artifacts: { ...prdState.artifacts, prd_path: '.omc/prd/feature.md' },
      };

      const result = transitionTeamPhase(withPrd, 'team-exec');
      expect(result.ok).toBe(true);
    });
  });

  // ============================================================================
  // 3. exec → verify 转换（部分任务完成）
  // ============================================================================

  describe('exec → verify transition', () => {
    it('rejects when tasks are incomplete', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const execState: TeamPipelineState = {
        ...state,
        phase: 'team-exec',
        artifacts: { ...state.artifacts, plan_path: '.omc/plans/team.md' },
        execution: {
          ...state.execution,
          tasks_total: 10,
          tasks_completed: 7,
        },
      };

      const result = transitionTeamPhase(execState, 'team-verify');
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('tasks_completed (7) < tasks_total (10)');
    });

    it('succeeds when all tasks are completed', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const execState: TeamPipelineState = {
        ...state,
        phase: 'team-exec',
        artifacts: { ...state.artifacts, plan_path: '.omc/plans/team.md' },
        execution: {
          ...state.execution,
          tasks_total: 5,
          tasks_completed: 5,
        },
      };

      const result = transitionTeamPhase(execState, 'team-verify');
      expect(result.ok).toBe(true);
      expect(result.state.phase).toBe('team-verify');
    });
  });

  // ============================================================================
  // 4. verify → fix 循环（超限场景）
  // ============================================================================

  describe('verify → fix loop with max attempts', () => {
    it('allows fix attempts within limit', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const verifyState: TeamPipelineState = {
        ...state,
        phase: 'team-verify',
        artifacts: { ...state.artifacts, plan_path: '.omc/plans/team.md' },
      };

      const toFix = transitionTeamPhase(verifyState, 'team-fix', 'verification-failed');
      expect(toFix.ok).toBe(true);
      expect(toFix.state.phase).toBe('team-fix');
      expect(toFix.state.fix_loop.attempt).toBe(1);
    });

    it('transitions to failed when max_attempts exceeded', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      let current: TeamPipelineState = {
        ...state,
        phase: 'team-verify',
        artifacts: { ...state.artifacts, plan_path: '.omc/plans/team.md' },
      };

      // Attempts 1, 2, 3 succeed (max_attempts = 3)
      for (let i = 0; i < 3; i++) {
        const toFix = transitionTeamPhase(current, 'team-fix');
        expect(toFix.ok).toBe(true);
        expect(toFix.state.phase).toBe('team-fix');

        // Go back to verify to retry
        current = { ...toFix.state, phase: 'team-verify' };
      }

      // 4th attempt exceeds max_attempts
      const overflow = transitionTeamPhase(current, 'team-fix');
      expect(overflow.ok).toBe(false);
      expect(overflow.state.phase).toBe('failed');
      expect(overflow.reason).toContain('Fix loop exceeded');
    });
  });

  // ============================================================================
  // 5. fix → complete/failed 终态
  // ============================================================================

  describe('fix → terminal states', () => {
    it('transitions to complete on success', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const fixState: TeamPipelineState = {
        ...state,
        phase: 'team-fix',
        artifacts: { ...state.artifacts, plan_path: '.omc/plans/team.md' },
        fix_loop: { attempt: 1, max_attempts: 3, last_failure_reason: null },
      };

      const result = transitionTeamPhase(fixState, 'complete', 'all-issues-resolved');
      expect(result.ok).toBe(true);
      expect(result.state.phase).toBe('complete');
      expect(result.state.active).toBe(false);
      expect(result.state.completed_at).not.toBeNull();
    });

    it('transitions to failed on unrecoverable error', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const fixState: TeamPipelineState = {
        ...state,
        phase: 'team-fix',
        artifacts: { ...state.artifacts, plan_path: '.omc/plans/team.md' },
      };

      const result = transitionTeamPhase(fixState, 'failed', 'critical-error');
      expect(result.ok).toBe(true);
      expect(result.state.phase).toBe('failed');
      expect(result.state.active).toBe(false);
    });
  });

  // ============================================================================
  // 6. 并发阶段转换冲突
  // ============================================================================

  describe('concurrent phase transitions', () => {
    it('handles concurrent writes with last-write-wins', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      writeTeamPipelineState(testDir, state, sessionId);

      // Simulate concurrent transitions
      const toPrd = transitionTeamPhase(state, 'team-prd', 'writer-1');
      const toPrd2 = transitionTeamPhase(state, 'team-prd', 'writer-2');

      writeTeamPipelineState(testDir, toPrd.state, sessionId);
      writeTeamPipelineState(testDir, toPrd2.state, sessionId);

      const final = readTeamPipelineState(testDir, sessionId);
      expect(final).not.toBeNull();
      expect(final!.phase).toBe('team-prd');
      // Last write wins
      expect(final!.phase_history[1].reason).toBe('writer-2');
    });
  });

  // ============================================================================
  // 7. 取消和恢复
  // ============================================================================

  describe('cancellation and resume', () => {
    it('cancels active pipeline', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const cancelled = requestTeamCancel(state, true);

      expect(cancelled.phase).toBe('cancelled');
      expect(cancelled.active).toBe(false);
      expect(cancelled.cancel.requested).toBe(true);
      expect(cancelled.cancel.preserve_for_resume).toBe(true);
    });

    it('resumes from cancelled state', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const cancelled = requestTeamCancel(state, true);

      const resumed = transitionTeamPhase(cancelled, 'team-plan', 'user-resumed');
      expect(resumed.ok).toBe(true);
      expect(resumed.state.phase).toBe('team-plan');
      expect(resumed.state.active).toBe(true);
    });

    it('rejects resume when preserve_for_resume is false', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const cancelled = requestTeamCancel(state, false);

      const result = transitionTeamPhase(cancelled, 'team-plan');
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('preserve_for_resume is not set');
    });
  });

  // ============================================================================
  // 8. 状态持久化
  // ============================================================================

  describe('state persistence', () => {
    it('persists and reads state correctly', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      const written = writeTeamPipelineState(testDir, state, sessionId);
      expect(written).toBe(true);

      const read = readTeamPipelineState(testDir, sessionId);
      expect(read).not.toBeNull();
      expect(read!.phase).toBe('team-plan');
      expect(read!.session_id).toBe(sessionId);
    });

    it('clears state file', () => {
      const state = initTeamPipelineState(testDir, sessionId);
      writeTeamPipelineState(testDir, state, sessionId);

      const cleared = clearTeamPipelineState(testDir, sessionId);
      expect(cleared).toBe(true);

      const read = readTeamPipelineState(testDir, sessionId);
      expect(read).toBeNull();
    });

    it('returns null for non-existent state', () => {
      const read = readTeamPipelineState(testDir, 'non-existent-session');
      expect(read).toBeNull();
    });
  });
});

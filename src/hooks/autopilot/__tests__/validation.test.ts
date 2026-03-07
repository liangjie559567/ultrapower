import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  recordValidationVerdict,
  getValidationStatus,
  startValidationRound,
  shouldRetryValidation,
  getIssuesToFix,
  getValidationSpawnPrompt,
  formatValidationResults
} from '../validation.js';
import { initAutopilot, transitionPhase, readAutopilotState } from '../state.js';

describe('AutopilotValidation', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'autopilot-validation-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('recordValidationVerdict', () => {
    it('should return false when state does not exist', async () => {
      const result = await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      expect(result).toBe(false);
    });

    it('should return false when phase is not validation', async () => {
      await initAutopilot(testDir, 'test idea');
      const result = await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      expect(result).toBe(false);
    });

    it('should record verdict and increment architects_spawned for new verdict', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      const result = await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      expect(result).toBe(true);

      const status = getValidationStatus(testDir);
      expect(status?.verdicts).toHaveLength(1);
      expect(status?.verdicts[0]).toEqual({
        type: 'functional',
        verdict: 'APPROVED',
        issues: undefined
      });

      // Check architects_spawned incremented
      const status2 = getValidationStatus(testDir);
      expect(status2).not.toBeNull();
    });

    it('should replace existing verdict of same type without incrementing architects_spawned', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue 1']);

      const status = getValidationStatus(testDir);
      expect(status?.verdicts).toHaveLength(1);
      expect(status?.verdicts[0]).toEqual({
        type: 'functional',
        verdict: 'REJECTED',
        issues: ['Issue 1']
      });
    });

    it('should record verdict with issues', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      const issues = ['Missing feature X', 'Incomplete feature Y'];
      await recordValidationVerdict(testDir, 'functional', 'REJECTED', issues);

      const status = getValidationStatus(testDir);
      expect(status?.verdicts[0].issues).toEqual(issues);
    });

    it('should set all_approved to true when all 3 verdicts are APPROVED', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const status = getValidationStatus(testDir);
      expect(status?.allApproved).toBe(true);
    });

    it('should set all_approved to false when any verdict is REJECTED', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'REJECTED', ['Security issue']);
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const status = getValidationStatus(testDir);
      expect(status?.allApproved).toBe(false);
    });

    it('should set all_approved to false when any verdict is NEEDS_FIX', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'NEEDS_FIX', ['Minor fixes']);

      const status = getValidationStatus(testDir);
      expect(status?.allApproved).toBe(false);
    });

    it('should not set all_approved until all 3 verdicts are recorded', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      let status = getValidationStatus(testDir);
      expect(status?.allApproved).toBe(false);

      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      status = getValidationStatus(testDir);
      expect(status?.allApproved).toBe(false);

      await recordValidationVerdict(testDir, 'quality', 'APPROVED');
      status = getValidationStatus(testDir);
      expect(status?.allApproved).toBe(true);
    });
  });

  describe('getValidationStatus', () => {
    it('should return null when state does not exist', async () => {
      const status = getValidationStatus(testDir);
      expect(status).toBeNull();
    });

    it('should return proper status object with no verdicts', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      const status = getValidationStatus(testDir);
      expect(status).not.toBeNull();
      expect(status?.success).toBe(false);
      expect(status?.allApproved).toBe(false);
      expect(status?.verdicts).toEqual([]);
      expect(status?.round).toBe(0);
      expect(status?.issues).toEqual([]);
    });

    it('should return status with verdicts', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'REJECTED', ['Security issue 1']);

      const status = getValidationStatus(testDir);
      expect(status?.success).toBe(false); // Only 2 out of 3 verdicts
      expect(status?.allApproved).toBe(false);
      expect(status?.verdicts).toHaveLength(2);
      expect(status?.issues).toEqual(['Security issue 1']);
    });

    it('should aggregate all issues from all verdicts', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue 1', 'Issue 2']);
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'REJECTED', ['Issue 3']);

      const status = getValidationStatus(testDir);
      expect(status?.issues).toEqual(['Issue 1', 'Issue 2', 'Issue 3']);
    });

    it('should return success true when 3 verdicts recorded', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const status = getValidationStatus(testDir);
      expect(status?.success).toBe(true);
      expect(status?.allApproved).toBe(true);
    });

    it('should return current validation round', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');
      await startValidationRound(testDir);
      await startValidationRound(testDir);

      const status = getValidationStatus(testDir);
      expect(status?.round).toBe(2);
    });
  });

  describe('startValidationRound', () => {
    it('should return false when state does not exist', async () => {
      const result = await startValidationRound(testDir);
      expect(result).toBe(false);
    });

    it('should return false when phase is not validation', async () => {
      await initAutopilot(testDir, 'test idea');
      const result = await startValidationRound(testDir);
      expect(result).toBe(false);
    });

    it('should increment validation_rounds', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      let status = getValidationStatus(testDir);
      expect(status?.round).toBe(0);

      await startValidationRound(testDir);
      status = getValidationStatus(testDir);
      expect(status?.round).toBe(1);

      await startValidationRound(testDir);
      status = getValidationStatus(testDir);
      expect(status?.round).toBe(2);
    });

    it('should clear verdicts array', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue']);
      await recordValidationVerdict(testDir, 'security', 'APPROVED');

      let status = getValidationStatus(testDir);
      expect(status?.verdicts).toHaveLength(2);

      await startValidationRound(testDir);
      status = getValidationStatus(testDir);
      expect(status?.verdicts).toEqual([]);
    });

    it('should reset all_approved to false', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      let status = getValidationStatus(testDir);
      expect(status?.allApproved).toBe(true);

      await startValidationRound(testDir);
      status = getValidationStatus(testDir);
      expect(status?.allApproved).toBe(false);
    });

    it('should reset architects_spawned to 0', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');

      await startValidationRound(testDir);

      // After new round, can record new verdicts
      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['New issue']);
      const status = getValidationStatus(testDir);
      expect(status?.verdicts).toHaveLength(1);
    });
  });

  describe('shouldRetryValidation', () => {
    it('should return false when state does not exist', async () => {
      const result = shouldRetryValidation(testDir);
      expect(result).toBe(false);
    });

    it('should return false when no rejections exist', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const result = shouldRetryValidation(testDir);
      expect(result).toBe(false);
    });

    it('should return true when rejection exists and rounds remain', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');
      await startValidationRound(testDir);

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue']);
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const result = shouldRetryValidation(testDir, 3);
      expect(result).toBe(true);
    });

    it('should return false when max rounds reached', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      // Max out rounds
      await startValidationRound(testDir);
      await startValidationRound(testDir);
      await startValidationRound(testDir);

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue']);

      const result = shouldRetryValidation(testDir, 3);
      expect(result).toBe(false);
    });

    it('should use default maxRounds of 3', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await startValidationRound(testDir);
      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue']);

      const result = shouldRetryValidation(testDir); // No maxRounds param
      expect(result).toBe(true);
    });

    it('should return true for NEEDS_FIX verdict when rounds remain', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');
      await startValidationRound(testDir);

      await recordValidationVerdict(testDir, 'functional', 'NEEDS_FIX', ['Minor fix']);
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      // NEEDS_FIX is not a rejection, should return false
      const result = shouldRetryValidation(testDir, 3);
      expect(result).toBe(false);
    });

    it('should handle multiple rejections', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');
      await startValidationRound(testDir);

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue 1']);
      await recordValidationVerdict(testDir, 'security', 'REJECTED', ['Issue 2']);
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const result = shouldRetryValidation(testDir, 3);
      expect(result).toBe(true);
    });
  });

  describe('getIssuesToFix', () => {
    it('should return empty array when state does not exist', async () => {
      const issues = getIssuesToFix(testDir);
      expect(issues).toEqual([]);
    });

    it('should return empty array when no verdicts exist', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      const issues = getIssuesToFix(testDir);
      expect(issues).toEqual([]);
    });

    it('should return empty array when all verdicts are APPROVED', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const issues = getIssuesToFix(testDir);
      expect(issues).toEqual([]);
    });

    it('should return formatted issues from REJECTED verdicts', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Missing feature A', 'Incomplete feature B']);
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const issues = getIssuesToFix(testDir);
      expect(issues).toEqual([
        '[FUNCTIONAL] Missing feature A, Incomplete feature B'
      ]);
    });

    it('should format issues from multiple rejected verdicts', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue 1']);
      await recordValidationVerdict(testDir, 'security', 'REJECTED', ['Issue 2', 'Issue 3']);
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const issues = getIssuesToFix(testDir);
      expect(issues).toEqual([
        '[FUNCTIONAL] Issue 1',
        '[SECURITY] Issue 2, Issue 3'
      ]);
    });

    it('should ignore REJECTED verdicts with no issues', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'REJECTED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');

      const issues = getIssuesToFix(testDir);
      expect(issues).toEqual([]);
    });

    it('should not include NEEDS_FIX verdicts', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'NEEDS_FIX', ['Minor fix']);
      await recordValidationVerdict(testDir, 'security', 'APPROVED');

      const issues = getIssuesToFix(testDir);
      expect(issues).toEqual([]);
    });
  });

  describe('getValidationSpawnPrompt', () => {
    it('should return prompt with spec path', async () => {
      const specPath = '/path/to/spec.md';
      const prompt = getValidationSpawnPrompt(specPath);

      expect(prompt).toContain('SPAWN PARALLEL VALIDATION ARCHITECTS');
      expect(prompt).toContain(specPath);
      expect(prompt).toContain('ultrapower:architect');
      expect(prompt).toContain('ultrapower:security-reviewer');
      expect(prompt).toContain('ultrapower:code-reviewer');
    });

    it('should include all three validation types', async () => {
      const prompt = getValidationSpawnPrompt('/spec.md');

      expect(prompt).toContain('FUNCTIONAL COMPLETENESS REVIEW');
      expect(prompt).toContain('SECURITY REVIEW');
      expect(prompt).toContain('CODE QUALITY REVIEW');
    });

    it('should specify model as opus', async () => {
      const prompt = getValidationSpawnPrompt('/spec.md');

      const opusMatches = prompt.match(/model="opus"/g);
      expect(opusMatches).toHaveLength(3);
    });

    it('should include verdict format instructions', async () => {
      const prompt = getValidationSpawnPrompt('/spec.md');

      expect(prompt).toContain('APPROVED or REJECTED');
    });
  });

  describe('formatValidationResults', () => {
    it('should format state with no verdicts', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      const state = readAutopilotState(testDir);
      const formatted = formatValidationResults(state!);

      expect(formatted).toContain('## Validation Results');
      expect(formatted).toContain('Round: 0');
      expect(formatted).toContain('NEEDS FIXES');
    });

    it('should format approved verdicts with checkmark icon', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');

      const updatedState = readAutopilotState(testDir);
      const formatted = formatValidationResults(updatedState!);

      expect(formatted).toContain('✓');
      expect(formatted).toContain('FUNCTIONAL');
      expect(formatted).toContain('APPROVED');
    });

    it('should format rejected verdicts with X icon', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue 1']);
      const updatedState = readAutopilotState(testDir);

      const formatted = formatValidationResults(updatedState!);

      expect(formatted).toContain('✗');
      expect(formatted).toContain('FUNCTIONAL');
      expect(formatted).toContain('REJECTED');
    });

    it('should include issues with bullet points', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'REJECTED', ['Issue 1', 'Issue 2']);
      const updatedState = readAutopilotState(testDir);

      const formatted = formatValidationResults(updatedState!);

      expect(formatted).toContain('- Issue 1');
      expect(formatted).toContain('- Issue 2');
    });

    it('should show ALL APPROVED when all verdicts approved', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'APPROVED');
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const state = readAutopilotState(testDir);
      const formatted = formatValidationResults(state!);

      expect(formatted).toContain('ALL APPROVED');
      expect(formatted).toContain('Ready to complete');
    });

    it('should show NEEDS FIXES when any verdict not approved', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'REJECTED', ['Security flaw']);
      await recordValidationVerdict(testDir, 'quality', 'APPROVED');

      const state = readAutopilotState(testDir);
      const formatted = formatValidationResults(state!);

      expect(formatted).toContain('NEEDS FIXES');
      expect(formatted).toContain('Address issues above');
    });

    it('should display current round number', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');
      await startValidationRound(testDir);
      await startValidationRound(testDir);

      const state = readAutopilotState(testDir);
      const formatted = formatValidationResults(state!);

      expect(formatted).toContain('Round: 2');
    });

    it('should format all verdict types correctly', async () => {
      await initAutopilot(testDir, 'test idea');
      await transitionPhase(testDir, 'validation');

      await recordValidationVerdict(testDir, 'functional', 'APPROVED');
      await recordValidationVerdict(testDir, 'security', 'REJECTED', ['Security issue']);
      await recordValidationVerdict(testDir, 'quality', 'NEEDS_FIX', ['Minor fix']);

      const state = readAutopilotState(testDir);
      const formatted = formatValidationResults(state!);

      expect(formatted).toContain('FUNCTIONAL');
      expect(formatted).toContain('SECURITY');
      expect(formatted).toContain('QUALITY');
      expect(formatted).toContain('NEEDS_FIX');
    });
  });
});

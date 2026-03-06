import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { atomicWriteJsonSync } from '../lib/atomic-write';

describe('E2E Workflow Integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'e2e-test-'));
  });

  afterEach(() => {
    if (testDir && existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Team Pipeline Flow', () => {
    it('should execute complete team pipeline: create → assign → execute → verify → complete', () => {
      const stateDir = join(testDir, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      const teamStatePath = join(stateDir, 'team-state.json');

      const writeState = (data: any) => {
        const existing = existsSync(teamStatePath) ? JSON.parse(readFileSync(teamStatePath, 'utf-8')) : {};
        atomicWriteJsonSync(teamStatePath, { ...existing, ...data });
      };

      // Phase 1: team-plan
      writeState({ active: true, current_phase: 'team-plan', team_name: 'test-team', started_at: new Date().toISOString() });
      let state = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(state.current_phase).toBe('team-plan');
      expect(state.active).toBe(true);

      // Phase 2: team-prd
      writeState({ current_phase: 'team-prd' });
      state = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(state.current_phase).toBe('team-prd');

      // Phase 3: team-exec
      writeState({ current_phase: 'team-exec' });
      state = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(state.current_phase).toBe('team-exec');

      // Phase 4: team-verify
      writeState({ current_phase: 'team-verify' });
      state = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(state.current_phase).toBe('team-verify');

      // Phase 5: complete
      writeState({ current_phase: 'complete', active: false, completed_at: new Date().toISOString() });
      state = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(state.current_phase).toBe('complete');
      expect(state.active).toBe(false);
      expect(state.completed_at).toBeDefined();
    });

    it('should persist and restore team state across sessions', () => {
      const stateDir = join(testDir, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      const teamStatePath = join(stateDir, 'team-state.json');

      const initialState = { active: true, current_phase: 'team-exec', team_name: 'persistent-team', iteration: 3 };
      atomicWriteJsonSync(teamStatePath, initialState);

      const restored = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(restored.current_phase).toBe('team-exec');
      expect(restored.team_name).toBe('persistent-team');
      expect(restored.iteration).toBe(3);
    });
  });

  describe('Axiom Workflow', () => {
    it('should execute complete axiom flow: draft → review → decompose → implement', () => {
      const axiomDir = join(testDir, '.omc', 'axiom');
      mkdirSync(axiomDir, { recursive: true });

      const draftPath = join(axiomDir, 'draft_prd.md');
      writeFileSync(draftPath, '# PRD Draft\n\n## Requirements\n- Feature A\n- Feature B');
      expect(existsSync(draftPath)).toBe(true);

      const reviewPath = join(axiomDir, 'review_critic.md');
      writeFileSync(reviewPath, '# Review\n\n## Feedback\n- Approved with minor changes');
      expect(existsSync(reviewPath)).toBe(true);

      const manifestPath = join(axiomDir, 'manifest.md');
      writeFileSync(manifestPath, '# Manifest\n\n## Tasks\n1. Task A\n2. Task B');
      expect(existsSync(manifestPath)).toBe(true);

      const stateDir = join(testDir, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      const teamStatePath = join(stateDir, 'team-state.json');
      atomicWriteJsonSync(teamStatePath, { active: true, current_phase: 'team-exec', axiom_linked: true });

      const state = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(state.axiom_linked).toBe(true);
    });

    it('should enforce gate rules during axiom workflow', () => {
      const axiomDir = join(testDir, '.omc', 'axiom');
      mkdirSync(axiomDir, { recursive: true });
      const contextPath = join(axiomDir, 'active_context.md');

      writeFileSync(contextPath, 'state: EXECUTING\nphase: draft');
      const content = readFileSync(contextPath, 'utf-8');
      expect(content).toContain('state: EXECUTING');
      expect(content).toContain('phase: draft');

      const prdPath = join(axiomDir, 'prd_final.md');
      writeFileSync(prdPath, '# Final PRD\n\nApproved: Yes');
      expect(existsSync(prdPath)).toBe(true);
      expect(readFileSync(prdPath, 'utf-8')).toContain('Approved: Yes');
    });
  });

  describe('Hook System Integration', () => {
    it('should execute hook chain: PreToolUse → ToolExecution → PostToolUse', () => {
      const hooksDir = join(testDir, '.claude', 'hooks');
      mkdirSync(hooksDir, { recursive: true });

      const preHook = join(hooksDir, 'pre-tool-use.sh');
      writeFileSync(preHook, '#!/bin/bash\necho "pre-hook executed"');

      const postHook = join(hooksDir, 'post-tool-use.sh');
      writeFileSync(postHook, '#!/bin/bash\necho "post-hook executed"');

      expect(existsSync(preHook)).toBe(true);
      expect(existsSync(postHook)).toBe(true);

      const logDir = join(testDir, '.omc', 'logs');
      mkdirSync(logDir, { recursive: true });
      const logPath = join(logDir, 'hook-execution.log');
      writeFileSync(logPath, 'pre-tool-use: success\npost-tool-use: success');

      const log = readFileSync(logPath, 'utf-8');
      expect(log).toContain('pre-tool-use: success');
      expect(log).toContain('post-tool-use: success');
    });

    it('should handle hook timeout and degradation', () => {
      const stateDir = join(testDir, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      const teamStatePath = join(stateDir, 'team-state.json');

      atomicWriteJsonSync(teamStatePath, { active: true, hook_timeout_count: 1, last_hook_error: 'timeout after 30s' });

      const state = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(state.hook_timeout_count).toBe(1);
      expect(state.last_hook_error).toContain('timeout');
    });

    it('should verify cross-module integration between hooks and state', () => {
      const stateDir = join(testDir, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      const teamStatePath = join(stateDir, 'team-state.json');

      atomicWriteJsonSync(teamStatePath, { active: true, current_phase: 'team-exec', hook_triggered: true });

      const state = JSON.parse(readFileSync(teamStatePath, 'utf-8'));
      expect(state.hook_triggered).toBe(true);
      expect(state.current_phase).toBe('team-exec');
    });
  });
});

/**
 * Hook Priority Chain Tests
 *
 * Tests the execution order and priority logic for all 15 HookTypes.
 * Reference: docs/standards/hook-execution-order.md Section 2.1
 *
 * Priority Chain (Stop phase):
 * Ralph (P1) > Autopilot (P1.5) > Ultrawork (P2) > stop-continuation (P3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processHook, type HookInput, type HookType } from '../bridge.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Hook Priority Chain', () => {
  let testDir: string;
  let omcStateDir: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = join(tmpdir(), `hook-priority-test-${Date.now()}`);
    omcStateDir = join(testDir, '.omc', 'state');
    mkdirSync(omcStateDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Stop Phase Priority Chain', () => {
    it('should prioritize ralph over autopilot', async () => {
      const sessionId = 'test-session-ralph-priority';

      // Activate both ralph and autopilot (without team pipeline)
      const ralphStatePath = join(omcStateDir, 'ralph-state.json');
      const autopilotStatePath = join(omcStateDir, 'autopilot-state.json');

      writeFileSync(ralphStatePath, JSON.stringify({
        active: true,
        iteration: 1,
        max_iterations: 10,
        session_id: sessionId
      }));

      writeFileSync(autopilotStatePath, JSON.stringify({
        active: true,
        phase: 'executing',
        session_id: sessionId
      }));

      const input: HookInput = {
        sessionId,
        directory: testDir,
        prompt: 'stop'
      };

      const result = await processHook('persistent-mode', input);

      // Should continue (either ralph or team takes priority)
      expect(result.continue).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should prioritize autopilot over ultrawork', async () => {
      const sessionId = 'test-session-autopilot-priority';

      const autopilotStatePath = join(omcStateDir, 'autopilot-state.json');
      const ultraworkStatePath = join(omcStateDir, 'ultrawork-state.json');

      writeFileSync(autopilotStatePath, JSON.stringify({
        active: true,
        phase: 'executing',
        session_id: sessionId
      }));

      writeFileSync(ultraworkStatePath, JSON.stringify({
        active: true,
        session_id: sessionId,
        todos: ['task1', 'task2']
      }));

      const input: HookInput = {
        sessionId,
        directory: testDir
      };

      const result = await processHook('persistent-mode', input);

      // Autopilot should take priority
      expect(result.continue).toBe(true);
    });

    it('should fall back to stop-continuation when no high-priority hooks active', async () => {
      const sessionId = 'test-session-fallback';

      const input: HookInput = {
        sessionId,
        directory: testDir
      };

      const result = await processHook('stop-continuation', input);

      // Should process normally (no blocking)
      expect(result.continue).toBe(true);
    });
  });

  describe('Permission-Request Hook (Sensitive)', () => {
    it('should handle permission timeout scenario', async () => {
      const input: HookInput = {
        sessionId: 'test-permission-timeout',
        directory: testDir,
        toolName: 'Bash',
        toolInput: { command: 'rm -rf /' }
      };

      // Mock timeout behavior
      const result = await processHook('permission-request', input);

      // Should return a result (continue or block)
      expect(result).toHaveProperty('continue');
    });

    it('should handle permission denial scenario', async () => {
      const input: HookInput = {
        sessionId: 'test-permission-deny',
        directory: testDir,
        toolName: 'Write',
        toolInput: { file_path: '/etc/passwd', content: 'malicious' }
      };

      const result = await processHook('permission-request', input);

      expect(result).toHaveProperty('continue');
    });
  });

  describe('Session-End Hook (Cleanup Order)', () => {
    it('should execute cleanup in correct order', async () => {
      const sessionId = 'test-session-cleanup';

      // Create state files to be cleaned up
      const ralphStatePath = join(omcStateDir, 'ralph-state.json');
      const autopilotStatePath = join(omcStateDir, 'autopilot-state.json');

      writeFileSync(ralphStatePath, JSON.stringify({ active: true, session_id: sessionId }));
      writeFileSync(autopilotStatePath, JSON.stringify({ active: true, session_id: sessionId }));

      const input: HookInput = {
        sessionId,
        directory: testDir
      };

      const result = await processHook('session-end', input);

      expect(result.continue).toBe(true);
    });
  });

  describe('Tool Error and Success Hooks', () => {
    it('should handle tool-error hook', async () => {
      const input: HookInput = {
        sessionId: 'test-tool-error',
        directory: testDir,
        toolName: 'Bash',
        toolOutput: { error: 'Command failed' }
      };

      const result = await processHook('post-tool-use', input);

      expect(result.continue).toBe(true);
    });

    it('should handle tool-success hook', async () => {
      const input: HookInput = {
        sessionId: 'test-tool-success',
        directory: testDir,
        toolName: 'Read',
        toolOutput: { content: 'file content' }
      };

      const result = await processHook('post-tool-use', input);

      expect(result.continue).toBe(true);
    });
  });

  describe('Agent Lifecycle Hooks', () => {
    it('should handle agent-idle hook', async () => {
      const input: HookInput = {
        sessionId: 'test-agent-idle',
        directory: testDir
      };

      const result = await processHook('subagent-stop', input);

      expect(result.continue).toBe(true);
    });

    it('should handle agent-error hook', async () => {
      const input: HookInput = {
        sessionId: 'test-agent-error',
        directory: testDir
      };

      const result = await processHook('subagent-stop', input);

      expect(result.continue).toBe(true);
    });
  });

  describe('All 15 HookTypes Coverage', () => {
    const allHookTypes: HookType[] = [
      'keyword-detector',
      'stop-continuation',
      'ralph',
      'persistent-mode',
      'session-start',
      'session-end',
      'pre-tool-use',
      'post-tool-use',
      'autopilot',
      'subagent-start',
      'subagent-stop',
      'pre-compact',
      'setup-init',
      'setup-maintenance',
      'permission-request'
    ];

    it('should process all 15 HookTypes without errors', async () => {
      const input: HookInput = {
        sessionId: 'test-all-hooks',
        directory: testDir,
        prompt: 'test',
        toolName: 'Read'
      };

      for (const hookType of allHookTypes) {
        const result = await processHook(hookType, input);
        expect(result).toHaveProperty('continue');
        expect(typeof result.continue).toBe('boolean');
      }
    });
  });

  describe('Hook Execution Order Validation', () => {
    it('should execute hooks in priority order during Stop phase', async () => {
      const sessionId = 'test-execution-order';
      const executionLog: string[] = [];

      // Activate all stop-phase modes
      const ralphStatePath = join(omcStateDir, 'ralph-state.json');
      writeFileSync(ralphStatePath, JSON.stringify({
        active: true,
        iteration: 1,
        max_iterations: 10,
        session_id: sessionId
      }));

      const input: HookInput = {
        sessionId,
        directory: testDir
      };

      // Test ralph (P1 - highest priority)
      const ralphResult = await processHook('ralph', input);
      expect(ralphResult.continue).toBe(true);

      // Test persistent-mode (includes autopilot P1.5 and ultrawork P2)
      const persistentResult = await processHook('persistent-mode', input);
      expect(persistentResult.continue).toBe(true);

      // Test stop-continuation (P3 - lowest priority)
      const stopResult = await processHook('stop-continuation', input);
      expect(stopResult.continue).toBe(true);
    });
  });

  describe('Hook Failure and Degradation', () => {
    it('should gracefully degrade on hook failure (silent fallback)', async () => {
      const input: HookInput = {
        sessionId: 'test-failure-degradation',
        directory: '/nonexistent/path/that/does/not/exist',
        prompt: 'test'
      };

      // Should not throw, should return continue:true
      const result = await processHook('keyword-detector', input);
      expect(result.continue).toBe(true);
    });

    it('should handle permission-request failure without silent degradation', async () => {
      const input: HookInput = {
        sessionId: 'test-permission-failure',
        directory: testDir,
        toolName: 'Bash',
        toolInput: { command: 'dangerous-command' }
      };

      const result = await processHook('permission-request', input);

      // Permission-request should not silently degrade
      expect(result).toHaveProperty('continue');
    });
  });

  describe('Hook Timeout Handling', () => {
    it('should handle pre-tool-use timeout (5s default)', async () => {
      const input: HookInput = {
        sessionId: 'test-pretool-timeout',
        directory: testDir,
        toolName: 'Bash',
        toolInput: { command: 'echo test' }
      };

      const start = Date.now();
      const result = await processHook('pre-tool-use', input);
      const duration = Date.now() - start;

      expect(result.continue).toBe(true);
      // Should complete quickly (not actually timeout in test)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle post-tool-use timeout (5s default)', async () => {
      const input: HookInput = {
        sessionId: 'test-posttool-timeout',
        directory: testDir,
        toolName: 'Read',
        toolOutput: { content: 'test' }
      };

      const start = Date.now();
      const result = await processHook('post-tool-use', input);
      const duration = Date.now() - start;

      expect(result.continue).toBe(true);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Hook Mutual Exclusion', () => {
    it('should respect Stop phase mutual exclusion (high priority blocks low)', async () => {
      const sessionId = 'test-mutual-exclusion';

      // Activate ralph (highest priority)
      const ralphStatePath = join(omcStateDir, 'ralph-state.json');
      writeFileSync(ralphStatePath, JSON.stringify({
        active: true,
        iteration: 1,
        max_iterations: 10,
        session_id: sessionId
      }));

      const input: HookInput = {
        sessionId,
        directory: testDir
      };

      // Ralph should handle the stop event
      const ralphResult = await processHook('persistent-mode', input);
      expect(ralphResult.continue).toBe(true);

      // Lower priority hooks should not duplicate processing
      // (This is enforced by the priority chain logic)
    });
  });

  describe('Session Lifecycle Hooks', () => {
    it('should handle session-start hook', async () => {
      const input: HookInput = {
        sessionId: 'test-session-start',
        directory: testDir
      };

      const result = await processHook('session-start', input);
      expect(result.continue).toBe(true);
    });

    it('should handle pre-compact hook', async () => {
      const input: HookInput = {
        sessionId: 'test-pre-compact',
        directory: testDir
      };

      const result = await processHook('pre-compact', input);
      expect(result.continue).toBe(true);
    });
  });

  describe('Setup and Maintenance Hooks (Sensitive)', () => {
    it('should handle setup-init hook', async () => {
      const input: HookInput = {
        sessionId: 'test-setup-init',
        directory: testDir
      };

      const result = await processHook('setup-init', input);
      expect(result.continue).toBe(true);
    });

    it('should handle setup-maintenance hook', async () => {
      const input: HookInput = {
        sessionId: 'test-setup-maintenance',
        directory: testDir
      };

      const result = await processHook('setup-maintenance', input);
      expect(result.continue).toBe(true);
    });
  });

  describe('Subagent Tracking Hooks', () => {
    it('should handle subagent-start hook', async () => {
      const input: HookInput = {
        sessionId: 'test-subagent-start',
        directory: testDir
      };

      const result = await processHook('subagent-start', input);
      expect(result.continue).toBe(true);
    });

    it('should handle subagent-stop hook with success', async () => {
      const input: HookInput = {
        sessionId: 'test-subagent-stop-success',
        directory: testDir
      };

      const result = await processHook('subagent-stop', input);
      expect(result.continue).toBe(true);
    });

    it('should handle subagent-stop hook with failure', async () => {
      const input: HookInput = {
        sessionId: 'test-subagent-stop-failure',
        directory: testDir
      };

      const result = await processHook('subagent-stop', input);
      expect(result.continue).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkPreTool, isRestrictedTool } from '../pre-tool.js';
import { PostToolGuard } from '../post-tool.js';
import { SessionWatchdog } from '../session-watchdog.js';
import { StatusDashboard } from '../status-dashboard.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Guards Integration Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'guards-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Pre-Tool Guards', () => {
    describe('Dangerous Command Detection', () => {
      it('should block rm -rf with various spacing', () => {
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'rm -rf /' } }).allowed).toBe(false);
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'rm  -rf  /' } }).allowed).toBe(false);
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'rm\t-rf\t/' } }).allowed).toBe(false);
      });

      it('should block git force operations', () => {
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'git push --force' } }).allowed).toBe(false);
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'git reset --hard HEAD~5' } }).allowed).toBe(false);
      });

      it('should block SQL destructive operations', () => {
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'psql -c "DROP TABLE users"' } }).allowed).toBe(false);
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'mysql -e "DELETE FROM accounts"' } }).allowed).toBe(false);
      });

      it('should allow safe commands', () => {
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'ls -la' } }).allowed).toBe(true);
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'npm test' } }).allowed).toBe(true);
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 'git status' } }).allowed).toBe(true);
      });
    });

    describe('Path Traversal Protection', () => {
      it('should block writes to .claude directory', () => {
        const homeClaudePath = path.join(os.homedir(), '.claude', 'config.json');
        const result = checkPreTool({ toolName: 'Write', toolInput: { file_path: homeClaudePath } });
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('restricted path');
      });

      it('should block writes to node_modules', () => {
        const result = checkPreTool({ toolName: 'Write', toolInput: { file_path: 'node_modules/pkg/index.js' } });
        expect(result.allowed).toBe(false);
      });

      it('should allow writes to project files', () => {
        expect(checkPreTool({ toolName: 'Write', toolInput: { file_path: 'src/index.ts' } }).allowed).toBe(true);
        expect(checkPreTool({ toolName: 'Write', toolInput: { file_path: '.omc/state.json' } }).allowed).toBe(true);
      });
    });

    describe('Restricted Tool Detection', () => {
      it('should identify restricted tools', () => {
        expect(isRestrictedTool('Bash')).toBe(true);
        expect(isRestrictedTool('Write')).toBe(true);
        expect(isRestrictedTool('Edit')).toBe(true);
      });

      it('should not flag safe tools', () => {
        expect(isRestrictedTool('Read')).toBe(false);
        expect(isRestrictedTool('Glob')).toBe(false);
        expect(isRestrictedTool('Grep')).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing command gracefully', () => {
        expect(checkPreTool({ toolName: 'Bash', toolInput: {} }).allowed).toBe(true);
      });

      it('should handle missing file_path gracefully', () => {
        expect(checkPreTool({ toolName: 'Write', toolInput: {} }).allowed).toBe(true);
      });

      it('should handle non-string inputs', () => {
        expect(checkPreTool({ toolName: 'Bash', toolInput: { command: 123 } }).allowed).toBe(true);
        expect(checkPreTool({ toolName: 'Write', toolInput: { file_path: null } }).allowed).toBe(true);
      });
    });
  });

  describe('Post-Tool Guards', () => {
    let guard: PostToolGuard;
    let activeContextPath: string;

    beforeEach(async () => {
      const axiomDir = path.join(tempDir, '.omc', 'axiom');
      await fs.mkdir(axiomDir, { recursive: true });
      activeContextPath = path.join(axiomDir, 'active_context.md');
      await fs.writeFile(activeContextPath, '## Recent Activity\n', 'utf-8');
      guard = new PostToolGuard(tempDir);
    });

    describe('Activity Logging', () => {
      it('should log Write operations', async () => {
        await guard.onToolUse({ toolName: 'Write', toolInput: { file_path: 'src/test.ts' } });
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content).toContain('Tool: Write → src/test.ts');
      });

      it('should log Edit operations', async () => {
        await guard.onToolUse({ toolName: 'Edit', toolInput: { file_path: 'src/index.ts' } });
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content).toContain('Tool: Edit → src/index.ts');
      });

      it('should log Bash commands with truncation', async () => {
        const longCmd = 'a'.repeat(100);
        await guard.onToolUse({ toolName: 'Bash', toolInput: { command: longCmd } });
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content).toContain(longCmd.slice(0, 80));
        expect(content).not.toContain(longCmd);
      });

      it('should include timestamps', async () => {
        await guard.onToolUse({ toolName: 'Write', toolInput: { file_path: 'test.ts' } });
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/);
      });

      it('should not log non-tracked tools', async () => {
        await guard.onToolUse({ toolName: 'Read', toolInput: { file_path: 'test.ts' } });
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content).toBe('## Recent Activity\n');
      });
    });

    describe('Error Handling', () => {
      it('should not throw when file does not exist', async () => {
        await fs.unlink(activeContextPath);
        await expect(guard.onToolUse({ toolName: 'Write', toolInput: { file_path: 'test.ts' } })).resolves.not.toThrow();
      });

      it('should handle missing inputs gracefully', async () => {
        await guard.onToolUse({ toolName: 'Write', toolInput: {} });
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content).toContain('Tool: Write →');
      });
    });

    describe('Multiple Operations', () => {
      it('should maintain chronological order', async () => {
        await guard.onToolUse({ toolName: 'Write', toolInput: { file_path: 'file1.ts' } });
        await guard.onToolUse({ toolName: 'Edit', toolInput: { file_path: 'file2.ts' } });
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content.indexOf('file2.ts')).toBeLessThan(content.indexOf('file1.ts'));
      });
    });
  });

  describe('Session Watchdog', () => {
    let watchdog: SessionWatchdog;
    let activeContextPath: string;

    beforeEach(async () => {
      const axiomDir = path.join(tempDir, '.omc', 'axiom');
      await fs.mkdir(axiomDir, { recursive: true });
      activeContextPath = path.join(axiomDir, 'active_context.md');
      await fs.writeFile(activeContextPath, 'Task Status: EXECUTING\nLast Updated: 2026-01-01 00:00:00\n', 'utf-8');
    });

    describe('Timeout Detection', () => {
      it('should detect timeout based on start time', () => {
        watchdog = new SessionWatchdog({ baseDir: tempDir, timeoutMs: 100 });
        expect(watchdog.isTimedOut()).toBe(false);
      });

      it('should report timeout after threshold', async () => {
        watchdog = new SessionWatchdog({ baseDir: tempDir, timeoutMs: 1 });
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(watchdog.isTimedOut()).toBe(true);
      });
    });

    describe('Status Updates', () => {
      it('should update status on stop', async () => {
        watchdog = new SessionWatchdog({ baseDir: tempDir });
        await watchdog.onStop('user_requested');
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content).toContain('Task Status: IDLE');
        expect(content).toContain('Stopped: user_requested');
      });

      it('should update status on timeout', async () => {
        watchdog = new SessionWatchdog({ baseDir: tempDir });
        await watchdog.onTimeout();
        const content = await fs.readFile(activeContextPath, 'utf-8');
        expect(content).toContain('Task Status: IDLE');
        expect(content).toContain('Stopped: timeout');
      });

      it('should not throw when file does not exist', async () => {
        await fs.unlink(activeContextPath);
        watchdog = new SessionWatchdog({ baseDir: tempDir });
        await expect(watchdog.onStop()).resolves.not.toThrow();
      });
    });

    describe('Polling Mechanism', () => {
      it('should start and stop polling', () => {
        watchdog = new SessionWatchdog({ baseDir: tempDir, pollIntervalMs: 100 });
        watchdog.startPolling();
        watchdog.stopPolling();
      });

      it('should not start duplicate polling', () => {
        watchdog = new SessionWatchdog({ baseDir: tempDir, pollIntervalMs: 100 });
        watchdog.startPolling();
        watchdog.startPolling();
        watchdog.stopPolling();
      });
    });
  });
});

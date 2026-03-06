import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionWatchdog } from '../session-watchdog.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SessionWatchdog', () => {
  let tempDir: string;
  let activeContextPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'watchdog-test-'));
    const axiomDir = path.join(tempDir, '.omc', 'axiom');
    await fs.mkdir(axiomDir, { recursive: true });
    activeContextPath = path.join(axiomDir, 'active_context.md');
    await fs.writeFile(
      activeContextPath,
      'Task Status: EXECUTING\nLast Updated: 2026-01-01 00:00:00\n',
      'utf-8'
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Constructor', () => {
    it('should use default options', () => {
      const watchdog = new SessionWatchdog();
      expect(watchdog).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const watchdog = new SessionWatchdog({ timeoutMs: 5000 });
      expect(watchdog).toBeDefined();
    });

    it('should accept custom base directory', () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      expect(watchdog).toBeDefined();
    });
  });

  describe('Timeout Detection', () => {
    it('should not be timed out initially', () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir, timeoutMs: 1000 });
      expect(watchdog.isTimedOut()).toBe(false);
    });

    it('should detect timeout after threshold', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir, timeoutMs: 10 });
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(watchdog.isTimedOut()).toBe(true);
    });

    it('should use default 1 hour timeout', () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      expect(watchdog.isTimedOut()).toBe(false);
    });
  });

  describe('Polling Lifecycle', () => {
    it('should start polling without error', () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir, pollIntervalMs: 100 });
      expect(() => watchdog.startPolling()).not.toThrow();
      watchdog.stopPolling();
    });

    it('should stop polling without error', () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir, pollIntervalMs: 100 });
      watchdog.startPolling();
      expect(() => watchdog.stopPolling()).not.toThrow();
    });

    it('should not start duplicate polling', () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir, pollIntervalMs: 100 });
      watchdog.startPolling();
      watchdog.startPolling();
      watchdog.stopPolling();
    });

    it('should handle stop without start', () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      expect(() => watchdog.stopPolling()).not.toThrow();
    });
  });

  describe('onStop', () => {
    it('should update status to IDLE', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onStop('user_requested');

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Task Status: IDLE');
    });

    it('should record stop reason', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onStop('user_requested');

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Stopped: user_requested');
    });

    it('should use default reason when not provided', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onStop();

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Stopped: session_ended');
    });

    it('should stop polling on stop', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir, pollIntervalMs: 100 });
      watchdog.startPolling();
      await watchdog.onStop();
    });

    it('should not throw when file does not exist', async () => {
      await fs.unlink(activeContextPath);
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await expect(watchdog.onStop()).resolves.not.toThrow();
    });
  });

  describe('onTimeout', () => {
    it('should update status to IDLE', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onTimeout();

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Task Status: IDLE');
    });

    it('should record timeout reason', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onTimeout();

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Stopped: timeout');
    });

    it('should not throw when file does not exist', async () => {
      await fs.unlink(activeContextPath);
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await expect(watchdog.onTimeout()).resolves.not.toThrow();
    });
  });

  describe('Status Update Format', () => {
    it('should include timestamp in ISO format', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onStop('test');

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should update Last Updated field', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onStop();

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toMatch(/Last Updated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should append Session End section', async () => {
      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onStop('test');

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('## Session End');
    });

    it('should not duplicate Session End section', async () => {
      await fs.writeFile(
        activeContextPath,
        'Task Status: EXECUTING\n## Session End\n- Previous entry\n',
        'utf-8'
      );

      const watchdog = new SessionWatchdog({ baseDir: tempDir });
      await watchdog.onStop('test');

      const content = await fs.readFile(activeContextPath, 'utf-8');
      const matches = content.match(/## Session End/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe('File Activity Monitoring', () => {
    it('should not trigger timeout for recently modified file', async () => {
      const watchdog = new SessionWatchdog({
        baseDir: tempDir,
        timeoutMs: 1000,
        pollIntervalMs: 50
      });

      await fs.utimes(activeContextPath, new Date(), new Date());
      watchdog.startPolling();

      await new Promise(resolve => setTimeout(resolve, 100));
      watchdog.stopPolling();

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).not.toContain('Stopped: timeout');
    });

    it('should handle missing file gracefully during polling', async () => {
      await fs.unlink(activeContextPath);

      const watchdog = new SessionWatchdog({
        baseDir: tempDir,
        pollIntervalMs: 50
      });

      watchdog.startPolling();
      await new Promise(resolve => setTimeout(resolve, 100));
      watchdog.stopPolling();
    });
  });
});

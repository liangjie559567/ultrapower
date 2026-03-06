import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getWorkerHealthReports, checkWorkerHealth } from '../worker-health.js';
import { writeHeartbeat } from '../heartbeat.js';
import { registerMcpWorker } from '../team-registration.js';
import { logAuditEvent } from '../audit-log.js';
import type { HeartbeatData } from '../types.js';
import { createWorkerAdapter } from '../../workers/factory.js';

// Mock tmux-session to avoid needing actual tmux
vi.mock('../tmux-session.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../tmux-session.js')>();
  return {
    ...actual,
    isSessionAlive: vi.fn(() => false),
  };
});

describe('worker-health', () => {
  let testDir: string;
  const teamName = 'test-team';

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'worker-health-test-'));
  });

  afterEach(async () => {
    // Give time for SQLite to close
    await new Promise(resolve => setTimeout(resolve, 200));
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors on Windows
    }
    vi.restoreAllMocks();
  });

  async function registerWorker(name: string) {
    registerMcpWorker(
      teamName,
      name,
      'codex',
      'gpt-5.3-codex',
      'tmux-session',
      testDir,
      testDir
    );
    const adapter = await createWorkerAdapter('auto', testDir);
    if (!adapter) throw new Error('Failed to create adapter');
    await adapter.upsert({
      workerId: `team:${teamName}:${name}`,
      workerType: 'team',
      name,
      status: 'running',
      pid: process.pid,
      spawnedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      teamName,
    });
    await adapter.close();
  }

  async function writeWorkerHeartbeat(name: string, status: HeartbeatData['status'], consecutiveErrors = 0, currentTaskId?: string) {
    writeHeartbeat(testDir, {
      workerName: name,
      teamName,
      provider: 'codex',
      pid: process.pid,
      lastPollAt: new Date().toISOString(),
      status,
      consecutiveErrors,
      currentTaskId,
    });

    // Update adapter to match heartbeat
    const adapter = await createWorkerAdapter('auto', testDir);
    if (adapter) {
      const worker = await adapter.get(`team:${teamName}:${name}`);
      if (worker) {
        worker.status = status === 'polling' ? 'running' : status === 'quarantined' ? 'failed' : 'running';
        worker.consecutiveErrors = consecutiveErrors;
        worker.currentTaskId = currentTaskId;
        worker.lastHeartbeatAt = new Date().toISOString();
        await adapter.upsert(worker);
      }
      await adapter.close();
    }
  }

  describe('getWorkerHealthReports', () => {
    it('returns empty array when no workers registered', async () => {
      const reports = await getWorkerHealthReports(teamName, testDir);
      expect(reports).toEqual([]);
    });

    it('reports alive worker with fresh heartbeat', async () => {
      await registerWorker('worker1');
      await writeWorkerHeartbeat('worker1', 'polling');

      const reports = await getWorkerHealthReports(teamName, testDir);
      expect(reports).toHaveLength(1);
      expect(reports[0].workerName).toBe('worker1');
      expect(reports[0].isAlive).toBe(true);
      expect(reports[0].status).toBe('running');
      expect(reports[0].consecutiveErrors).toBe(0);
    });

    it('reports dead worker with stale heartbeat', async () => {
      await registerWorker('worker1');

      // Update adapter with old heartbeat and dead status
      const adapter = await createWorkerAdapter('auto', testDir);
      if (adapter) {
        const worker = await adapter.get(`team:${teamName}:worker1`);
        if (worker) {
          worker.lastHeartbeatAt = new Date(Date.now() - 60000).toISOString();
          worker.status = 'dead';
          await adapter.upsert(worker);
        }
        await adapter.close();
      }

      const reports = await getWorkerHealthReports(teamName, testDir, 30000);
      expect(reports).toHaveLength(1);
      expect(reports[0].isAlive).toBe(false);
      expect(reports[0].status).toBe('dead');
    });

    it('counts task completions and failures from audit log', async () => {
      await registerWorker('worker1');
      await writeWorkerHeartbeat('worker1', 'polling');

      // Log some audit events
      logAuditEvent(testDir, { timestamp: new Date().toISOString(), eventType: 'task_completed', teamName, workerName: 'worker1', taskId: 't1' });
      logAuditEvent(testDir, { timestamp: new Date().toISOString(), eventType: 'task_completed', teamName, workerName: 'worker1', taskId: 't2' });
      logAuditEvent(testDir, { timestamp: new Date().toISOString(), eventType: 'task_permanently_failed', teamName, workerName: 'worker1', taskId: 't3' });

      const reports = await getWorkerHealthReports(teamName, testDir);
      expect(reports[0].totalTasksCompleted).toBe(2);
      expect(reports[0].totalTasksFailed).toBe(1);
    });

    it('reports quarantined worker', async () => {
      await registerWorker('worker1');
      await writeWorkerHeartbeat('worker1', 'quarantined', 3);

      const reports = await getWorkerHealthReports(teamName, testDir);
      expect(reports[0].status).toBe('failed');
      expect(reports[0].consecutiveErrors).toBe(3);
    });
  });

  describe('checkWorkerHealth', () => {
    it('returns null for healthy worker', async () => {
      await registerWorker('worker1');
      await writeWorkerHeartbeat('worker1', 'polling');

      const result = await checkWorkerHealth(teamName, 'worker1', testDir);
      expect(result).toBeNull();
    });

    it('detects dead worker', async () => {
      const adapter = await createWorkerAdapter('auto', testDir);
      if (!adapter) throw new Error('Failed to create adapter');
      await adapter.upsert({
        workerId: `team:${teamName}:worker1`,
        workerType: 'team',
        name: 'worker1',
        status: 'dead',
        pid: process.pid,
        spawnedAt: new Date().toISOString(),
        lastHeartbeatAt: new Date(Date.now() - 60000).toISOString(),
        teamName,
      });
      await adapter.close();

      const result = await checkWorkerHealth(teamName, 'worker1', testDir, 30000);
      expect(result).toContain('dead');
    });

    it('detects quarantined worker', async () => {
      const adapter = await createWorkerAdapter('auto', testDir);
      if (!adapter) throw new Error('Failed to create adapter');
      await adapter.upsert({
        workerId: `team:${teamName}:worker1`,
        workerType: 'team',
        name: 'worker1',
        status: 'failed',
        pid: process.pid,
        spawnedAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        teamName,
        consecutiveErrors: 3,
      });
      await adapter.close();

      const result = await checkWorkerHealth(teamName, 'worker1', testDir);
      expect(result).toContain('consecutive errors');
    });

    it('warns about high error count', async () => {
      const adapter = await createWorkerAdapter('auto', testDir);
      if (!adapter) throw new Error('Failed to create adapter');
      await adapter.upsert({
        workerId: `team:${teamName}:worker1`,
        workerType: 'team',
        name: 'worker1',
        status: 'running',
        pid: process.pid,
        spawnedAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        teamName,
        consecutiveErrors: 2,
      });
      await adapter.close();

      const result = await checkWorkerHealth(teamName, 'worker1', testDir);
      expect(result).toContain('consecutive errors');
    });

    it('returns null when no heartbeat exists', async () => {
      const result = await checkWorkerHealth(teamName, 'nonexistent', testDir);
      expect(result).toContain('Worker not found');
    });
  });
});

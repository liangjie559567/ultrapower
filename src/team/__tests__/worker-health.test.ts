/**
 * Worker Health Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWorkerHealthReports, checkWorkerHealth } from '../worker-health.js';
import * as factoryModule from '../../workers/factory.js';
import * as tmuxModule from '../tmux-session.js';
import * as auditModule from '../audit-log.js';
import * as teamRegModule from '../team-registration.js';
import * as heartbeatModule from '../heartbeat.js';

describe('getWorkerHealthReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no workers exist', async () => {
    const mockAdapter = {
      list: vi.fn().mockResolvedValue([]),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);

    const reports = await getWorkerHealthReports('test-team', '/test/dir');

    expect(reports).toEqual([]);
  });

  it('should generate health report for alive worker', async () => {
    const mockWorker = {
      workerId: 'team:test-team:worker1',
      name: 'worker1',
      status: 'idle',
      consecutiveErrors: 0,
      currentTaskId: 'task-123',
    };

    const mockAdapter = {
      list: vi.fn().mockResolvedValue([mockWorker]),
      healthCheck: vi.fn().mockResolvedValue({
        isAlive: true,
        heartbeatAge: 5000,
        uptimeMs: 60000,
      }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);
    vi.spyOn(tmuxModule, 'isSessionAlive').mockReturnValue(true);
    vi.spyOn(auditModule, 'readAuditLog').mockReturnValue([
      { eventType: 'task_completed', timestamp: '2026-03-13T10:00:00Z' } as any,
    ]);

    const reports = await getWorkerHealthReports('test-team', '/test/dir');

    expect(reports).toHaveLength(1);
    expect(reports[0].workerName).toBe('worker1');
    expect(reports[0].isAlive).toBe(true);
    expect(reports[0].tmuxSessionAlive).toBe(true);
    expect(reports[0].totalTasksCompleted).toBe(1);
  });

  it('should handle dead worker', async () => {
    const mockWorker = {
      workerId: 'team:test-team:worker2',
      name: 'worker2',
      status: 'dead',
      consecutiveErrors: 3,
    };

    const mockAdapter = {
      list: vi.fn().mockResolvedValue([mockWorker]),
      healthCheck: vi.fn().mockResolvedValue({
        isAlive: false,
        heartbeatAge: 60000,
        uptimeMs: null,
      }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);
    vi.spyOn(tmuxModule, 'isSessionAlive').mockReturnValue(false);
    vi.spyOn(auditModule, 'readAuditLog').mockReturnValue([]);

    const reports = await getWorkerHealthReports('test-team', '/test/dir');

    expect(reports[0].isAlive).toBe(false);
    expect(reports[0].status).toBe('dead');
    expect(reports[0].consecutiveErrors).toBe(3);
  });

  it('should handle tmux check errors gracefully', async () => {
    const mockWorker = {
      workerId: 'team:test-team:worker3',
      name: 'worker3',
      status: 'idle',
    };

    const mockAdapter = {
      list: vi.fn().mockResolvedValue([mockWorker]),
      healthCheck: vi.fn().mockResolvedValue({ isAlive: true, heartbeatAge: 5000 }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);
    vi.spyOn(tmuxModule, 'isSessionAlive').mockImplementation(() => { throw new Error('tmux not available'); });
    vi.spyOn(auditModule, 'readAuditLog').mockReturnValue([]);

    const reports = await getWorkerHealthReports('test-team', '/test/dir');

    expect(reports[0].tmuxSessionAlive).toBe(false);
  });

  it('should handle audit log errors gracefully', async () => {
    const mockWorker = {
      workerId: 'team:test-team:worker4',
      name: 'worker4',
      status: 'idle',
    };

    const mockAdapter = {
      list: vi.fn().mockResolvedValue([mockWorker]),
      healthCheck: vi.fn().mockResolvedValue({ isAlive: true, heartbeatAge: 5000 }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);
    vi.spyOn(tmuxModule, 'isSessionAlive').mockReturnValue(true);
    vi.spyOn(auditModule, 'readAuditLog').mockImplementation(() => { throw new Error('audit log not found'); });

    const reports = await getWorkerHealthReports('test-team', '/test/dir');

    expect(reports[0].totalTasksCompleted).toBe(0);
    expect(reports[0].totalTasksFailed).toBe(0);
  });

  it('should use legacy path when adapter is null', async () => {
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(null);
    vi.spyOn(teamRegModule, 'listMcpWorkers').mockReturnValue([
      { name: 'worker1', agentId: 'agent-1', agentType: 'executor' },
    ]);
    vi.spyOn(heartbeatModule, 'readHeartbeat').mockReturnValue({
      status: 'idle',
      lastPollAt: new Date(Date.now() - 10000).toISOString(),
      consecutiveErrors: 0,
      currentTaskId: null,
    });
    vi.spyOn(heartbeatModule, 'isWorkerAlive').mockReturnValue(true);
    vi.spyOn(tmuxModule, 'isSessionAlive').mockReturnValue(true);
    vi.spyOn(auditModule, 'readAuditLog')
      .mockReturnValueOnce([{ eventType: 'task_completed' } as any])
      .mockReturnValueOnce([{ eventType: 'bridge_start', timestamp: new Date(Date.now() - 60000).toISOString() } as any]);

    const reports = await getWorkerHealthReports('test-team', '/test/dir');

    expect(reports).toHaveLength(1);
    expect(reports[0].workerName).toBe('worker1');
    expect(reports[0].isAlive).toBe(true);
    expect(reports[0].status).toBe('idle');
  });
});

describe('checkWorkerHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for healthy worker', async () => {
    const mockAdapter = {
      get: vi.fn().mockResolvedValue({ workerId: 'team:test-team:worker1', status: 'idle', consecutiveErrors: 0 }),
      healthCheck: vi.fn().mockResolvedValue({ isAlive: true, heartbeatAge: 5000 }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);
    vi.spyOn(tmuxModule, 'isSessionAlive').mockReturnValue(true);

    const result = await checkWorkerHealth('test-team', 'worker1', '/test/dir');

    expect(result).toBeNull();
  });

  it('should detect dead worker', async () => {
    const mockAdapter = {
      get: vi.fn().mockResolvedValue({ workerId: 'team:test-team:worker1', status: 'idle' }),
      healthCheck: vi.fn().mockResolvedValue({ isAlive: false, heartbeatAge: 60000 }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);
    vi.spyOn(tmuxModule, 'isSessionAlive').mockReturnValue(false);

    const result = await checkWorkerHealth('test-team', 'worker1', '/test/dir');

    expect(result).toContain('Worker is dead');
  });

  it('should detect hung worker', async () => {
    const mockAdapter = {
      get: vi.fn().mockResolvedValue({ workerId: 'team:test-team:worker1', status: 'idle' }),
      healthCheck: vi.fn().mockResolvedValue({ isAlive: false, heartbeatAge: 40000 }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);
    vi.spyOn(tmuxModule, 'isSessionAlive').mockReturnValue(true);

    const result = await checkWorkerHealth('test-team', 'worker1', '/test/dir');

    expect(result).toContain('may be hung');
  });

  it('should detect quarantined worker', async () => {
    const mockAdapter = {
      get: vi.fn().mockResolvedValue({
        workerId: 'team:test-team:worker1',
        status: 'idle',
        consecutiveErrors: 3,
        metadata: { quarantined: true },
      }),
      healthCheck: vi.fn().mockResolvedValue({ isAlive: true, heartbeatAge: 5000 }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);

    const result = await checkWorkerHealth('test-team', 'worker1', '/test/dir');

    expect(result).toContain('self-quarantined');
  });

  it('should detect worker at risk', async () => {
    const mockAdapter = {
      get: vi.fn().mockResolvedValue({
        workerId: 'team:test-team:worker1',
        status: 'idle',
        consecutiveErrors: 2,
      }),
      healthCheck: vi.fn().mockResolvedValue({ isAlive: true, heartbeatAge: 5000 }),
    };
    vi.spyOn(factoryModule, 'createWorkerAdapter').mockResolvedValue(mockAdapter as any);

    const result = await checkWorkerHealth('test-team', 'worker1', '/test/dir');

    expect(result).toContain('at risk of quarantine');
  });
});

/**
 * JSON Worker Adapter Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { JsonWorkerAdapter } from '../json-adapter.js';
import type { WorkerState } from '../types.js';

const TEST_CWD = join(process.cwd(), '.test-workers-json');

describe('JsonWorkerAdapter', () => {
  let adapter: JsonWorkerAdapter;

  beforeEach(async () => {
    if (existsSync(TEST_CWD)) {
      rmSync(TEST_CWD, { recursive: true, force: true });
    }
    mkdirSync(TEST_CWD, { recursive: true });
    adapter = new JsonWorkerAdapter(TEST_CWD);
    await adapter.init();
  });

  afterEach(async () => {
    await adapter.close();
    if (existsSync(TEST_CWD)) {
      rmSync(TEST_CWD, { recursive: true, force: true });
    }
  });

  it('should initialize state directory', async () => {
    const stateDir = join(TEST_CWD, '.omc', 'state', 'workers');
    expect(existsSync(stateDir)).toBe(true);
  });

  it('should upsert and get worker', async () => {
    const worker: WorkerState = {
      workerId: 'team:myteam:worker1',
      workerType: 'team',
      name: 'worker1',
      status: 'idle',
      spawnedAt: new Date().toISOString(),
      teamName: 'myteam',
    };

    const success = await adapter.upsert(worker);
    expect(success).toBe(true);

    const retrieved = await adapter.get('team:myteam:worker1');
    expect(retrieved).toMatchObject({
      workerId: 'team:myteam:worker1',
      workerType: 'team',
      status: 'idle',
    });
  });

  it('should update existing worker', async () => {
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'team',
      name: 'test',
      status: 'idle',
      spawnedAt: new Date().toISOString(),
    };

    await adapter.upsert(worker);

    worker.status = 'working';
    worker.currentTaskId = 'task-123';
    await adapter.upsert(worker);

    const retrieved = await adapter.get('test:1');
    expect(retrieved?.status).toBe('working');
    expect(retrieved?.currentTaskId).toBe('task-123');
  });

  it('should list workers with filter', async () => {
    const workers: WorkerState[] = [
      {
        workerId: 'mcp:1',
        workerType: 'mcp',
        name: 'mcp1',
        status: 'running',
        spawnedAt: new Date().toISOString(),
      },
      {
        workerId: 'team:1',
        workerType: 'team',
        name: 'team1',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
        teamName: 'myteam',
      },
    ];

    for (const w of workers) {
      await adapter.upsert(w);
    }

    const mcpWorkers = await adapter.list({ workerType: 'mcp' });
    expect(mcpWorkers).toHaveLength(1);

    const teamWorkers = await adapter.list({ workerType: 'team', teamName: 'myteam' });
    expect(teamWorkers).toHaveLength(1);
  });

  it('should filter by status', async () => {
    const workers: WorkerState[] = [
      { workerId: 'w1', workerType: 'team', name: 'w1', status: 'idle', spawnedAt: new Date().toISOString() },
      { workerId: 'w2', workerType: 'team', name: 'w2', status: 'working', spawnedAt: new Date().toISOString() },
      { workerId: 'w3', workerType: 'team', name: 'w3', status: 'dead', spawnedAt: new Date().toISOString() },
    ];

    for (const w of workers) {
      await adapter.upsert(w);
    }

    const idle = await adapter.list({ status: 'idle' });
    expect(idle).toHaveLength(1);

    const active = await adapter.list({ status: ['idle', 'working'] });
    expect(active).toHaveLength(2);
  });

  it('should delete worker', async () => {
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'team',
      name: 'test',
      status: 'idle',
      spawnedAt: new Date().toISOString(),
    };

    await adapter.upsert(worker);
    expect(await adapter.get('test:1')).toBeDefined();

    const deleted = await adapter.delete('test:1');
    expect(deleted).toBe(true);
    expect(await adapter.get('test:1')).toBeNull();
  });

  it('should perform health check', async () => {
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'team',
      name: 'test',
      status: 'working',
      spawnedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
    };

    await adapter.upsert(worker);

    const health = await adapter.healthCheck('test:1', 30000);
    expect(health.isAlive).toBe(true);
    expect(health.heartbeatAge).toBeLessThan(1000);
  });

  it('should detect dead worker', async () => {
    const oldTime = new Date(Date.now() - 60000).toISOString();
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'team',
      name: 'test',
      status: 'working',
      spawnedAt: oldTime,
      lastHeartbeatAt: oldTime,
    };

    await adapter.upsert(worker);

    const health = await adapter.healthCheck('test:1', 30000);
    expect(health.isAlive).toBe(false);
  });

  it('should batch upsert workers', async () => {
    const workers: WorkerState[] = Array.from({ length: 10 }, (_, i) => ({
      workerId: `test:${i}`,
      workerType: 'team' as const,
      name: `test${i}`,
      status: 'idle' as const,
      spawnedAt: new Date().toISOString(),
    }));

    const count = await adapter.batchUpsert(workers);
    expect(count).toBe(10);

    const all = await adapter.list();
    expect(all).toHaveLength(10);
  });

  it('should cleanup old workers', async () => {
    const oldTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const recentTime = new Date().toISOString();

    const workers: WorkerState[] = [
      { workerId: 'old1', workerType: 'team', name: 'old1', status: 'completed', spawnedAt: oldTime, completedAt: oldTime },
      { workerId: 'old2', workerType: 'team', name: 'old2', status: 'dead', spawnedAt: oldTime },
      { workerId: 'recent', workerType: 'team', name: 'recent', status: 'completed', spawnedAt: recentTime, completedAt: recentTime },
      { workerId: 'active', workerType: 'team', name: 'active', status: 'working', spawnedAt: oldTime },
    ];

    for (const w of workers) {
      await adapter.upsert(w);
    }

    const cleaned = await adapter.cleanup(24 * 60 * 60 * 1000);
    expect(cleaned).toBe(2);

    const remaining = await adapter.list();
    expect(remaining).toHaveLength(2);
  });

  it('should handle special characters in workerId', async () => {
    const worker: WorkerState = {
      workerId: 'team:my-team:worker@1',
      workerType: 'team',
      name: 'worker@1',
      status: 'idle',
      spawnedAt: new Date().toISOString(),
    };

    await adapter.upsert(worker);
    const retrieved = await adapter.get('team:my-team:worker@1');
    expect(retrieved?.workerId).toBe('team:my-team:worker@1');
  });

  it('should handle metadata', async () => {
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'team',
      name: 'test',
      status: 'idle',
      spawnedAt: new Date().toISOString(),
      metadata: { custom: 'value', nested: { key: 'val' } },
    };

    await adapter.upsert(worker);
    const retrieved = await adapter.get('test:1');
    expect(retrieved?.metadata).toEqual({ custom: 'value', nested: { key: 'val' } });
  });

  it('should skip corrupted files during list', async () => {
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'team',
      name: 'test',
      status: 'idle',
      spawnedAt: new Date().toISOString(),
    };

    await adapter.upsert(worker);

    // Create corrupted file
    const { writeFileSync } = await import('fs');
    const { join } = await import('path');
    const stateDir = join(TEST_CWD, '.omc', 'state', 'workers');
    writeFileSync(join(stateDir, 'corrupted.json'), 'invalid json{', 'utf-8');

    const workers = await adapter.list();
    expect(workers).toHaveLength(1);
    expect(workers[0].workerId).toBe('test:1');
  });
});

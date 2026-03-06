/**
 * SQLite Worker Adapter Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { SqliteWorkerAdapter } from '../sqlite-adapter.js';
import type { WorkerState } from '../types.js';

const TEST_CWD = join(process.cwd(), '.test-workers-sqlite');

describe('SqliteWorkerAdapter', () => {
  let adapter: SqliteWorkerAdapter;

  beforeEach(async () => {
    if (existsSync(TEST_CWD)) {
      rmSync(TEST_CWD, { recursive: true, force: true });
    }
    mkdirSync(TEST_CWD, { recursive: true });
    adapter = new SqliteWorkerAdapter(TEST_CWD);
    await adapter.init();
  });

  afterEach(async () => {
    await adapter.close();
    if (existsSync(TEST_CWD)) {
      rmSync(TEST_CWD, { recursive: true, force: true });
    }
  });

  it('should initialize database', async () => {
    const dbPath = join(TEST_CWD, '.omc', 'state', 'workers.db');
    expect(existsSync(dbPath)).toBe(true);
  });

  it('should upsert and get worker', async () => {
    const worker: WorkerState = {
      workerId: 'mcp:codex:job1',
      workerType: 'mcp',
      name: 'job1',
      status: 'running',
      spawnedAt: new Date().toISOString(),
      provider: 'codex',
      model: 'gpt-4',
      agentRole: 'executor',
    };

    const success = await adapter.upsert(worker);
    expect(success).toBe(true);

    const retrieved = await adapter.get('mcp:codex:job1');
    expect(retrieved).toMatchObject({
      workerId: 'mcp:codex:job1',
      workerType: 'mcp',
      status: 'running',
    });
  });

  it('should update existing worker', async () => {
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'mcp',
      name: 'test',
      status: 'running',
      spawnedAt: new Date().toISOString(),
    };

    await adapter.upsert(worker);

    worker.status = 'completed';
    worker.completedAt = new Date().toISOString();
    await adapter.upsert(worker);

    const retrieved = await adapter.get('test:1');
    expect(retrieved?.status).toBe('completed');
    expect(retrieved?.completedAt).toBeDefined();
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
    expect(mcpWorkers[0].workerType).toBe('mcp');

    const teamWorkers = await adapter.list({ workerType: 'team' });
    expect(teamWorkers).toHaveLength(1);
    expect(teamWorkers[0].teamName).toBe('myteam');
  });

  it('should filter by status', async () => {
    const workers: WorkerState[] = [
      { workerId: 'w1', workerType: 'mcp', name: 'w1', status: 'running', spawnedAt: new Date().toISOString() },
      { workerId: 'w2', workerType: 'mcp', name: 'w2', status: 'completed', spawnedAt: new Date().toISOString() },
      { workerId: 'w3', workerType: 'mcp', name: 'w3', status: 'failed', spawnedAt: new Date().toISOString() },
    ];

    for (const w of workers) {
      await adapter.upsert(w);
    }

    const running = await adapter.list({ status: 'running' });
    expect(running).toHaveLength(1);

    const terminal = await adapter.list({ status: ['completed', 'failed'] });
    expect(terminal).toHaveLength(2);
  });

  it('should delete worker', async () => {
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'mcp',
      name: 'test',
      status: 'running',
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
      workerType: 'mcp',
      name: 'test',
      status: 'running',
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
      workerType: 'mcp',
      name: 'test',
      status: 'running',
      spawnedAt: oldTime,
      lastHeartbeatAt: oldTime,
    };

    await adapter.upsert(worker);

    const health = await adapter.healthCheck('test:1', 30000);
    expect(health.isAlive).toBe(false);
    expect(health.heartbeatAge).toBeGreaterThan(30000);
  });

  it('should batch upsert workers', async () => {
    const workers: WorkerState[] = Array.from({ length: 10 }, (_, i) => ({
      workerId: `test:${i}`,
      workerType: 'mcp' as const,
      name: `test${i}`,
      status: 'running' as const,
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
      { workerId: 'old1', workerType: 'mcp', name: 'old1', status: 'completed', spawnedAt: oldTime, completedAt: oldTime },
      { workerId: 'old2', workerType: 'mcp', name: 'old2', status: 'failed', spawnedAt: oldTime, completedAt: oldTime },
      { workerId: 'recent', workerType: 'mcp', name: 'recent', status: 'completed', spawnedAt: recentTime, completedAt: recentTime },
      { workerId: 'active', workerType: 'mcp', name: 'active', status: 'running', spawnedAt: oldTime },
    ];

    for (const w of workers) {
      await adapter.upsert(w);
    }

    const cleaned = await adapter.cleanup(24 * 60 * 60 * 1000);
    expect(cleaned).toBe(2);

    const remaining = await adapter.list();
    expect(remaining).toHaveLength(2);
    expect(remaining.map(w => w.workerId).sort()).toEqual(['active', 'recent']);
  });

  it('should handle metadata', async () => {
    const worker: WorkerState = {
      workerId: 'test:1',
      workerType: 'mcp',
      name: 'test',
      status: 'running',
      spawnedAt: new Date().toISOString(),
      metadata: { custom: 'value', count: 42 },
    };

    await adapter.upsert(worker);
    const retrieved = await adapter.get('test:1');
    expect(retrieved?.metadata).toEqual({ custom: 'value', count: 42 });
  });
});

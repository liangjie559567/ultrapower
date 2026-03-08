/**
 * Performance Benchmark Tests for Worker Adapters
 * Target: healthCheck < 10ms, get < 5ms
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWorkerAdapter } from '../factory.js';
import type { WorkerStateAdapter, WorkerState } from '../types.js';
import { tmpdir } from 'os';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('Worker Adapter Performance', () => {
  let testDir: string;
  let adapter: WorkerStateAdapter | null;
  let cachedAdapter: WorkerStateAdapter | null;

  beforeAll(async () => {
    testDir = join(tmpdir(), `worker-perf-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    adapter = await createWorkerAdapter('json', testDir, { enableCache: false });
    cachedAdapter = await createWorkerAdapter('json', testDir, { enableCache: true });

    // Seed test data
    const workers: WorkerState[] = [];
    for (let i = 0; i < 10; i++) {
      workers.push({
        workerId: `test-worker-${i}`,
        workerType: 'team',
        name: `worker-${i}`,
        status: 'running',
        spawnedAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
      });
    }

    if (adapter) {
      await adapter.batchUpsert(workers);
    }
    if (cachedAdapter) {
      await cachedAdapter.batchUpsert(workers);
    }
  });

  afterAll(async () => {
    await adapter?.close();
    await cachedAdapter?.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('healthCheck should complete < 10ms', async () => {
    if (!adapter) throw new Error('Adapter not initialized');

    const start = performance.now();
    await adapter.healthCheck('test-worker-0');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);
  });

  it('get should complete < 5ms (cached)', async () => {
    if (!cachedAdapter) throw new Error('Cached adapter not initialized');

    // Warm up cache
    await cachedAdapter.get('test-worker-0');

    const start = performance.now();
    await cachedAdapter.get('test-worker-0');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5);
  });

  it('batchUpsert should handle 10 workers efficiently', async () => {
    if (!adapter) throw new Error('Adapter not initialized');

    const workers: WorkerState[] = [];
    for (let i = 10; i < 20; i++) {
      workers.push({
        workerId: `batch-worker-${i}`,
        workerType: 'mcp',
        name: `worker-${i}`,
        status: 'running',
        spawnedAt: new Date().toISOString(),
      });
    }

    const start = performance.now();
    const count = await adapter.batchUpsert(workers);
    const duration = performance.now() - start;

    expect(count).toBe(10);
    expect(duration).toBeLessThan(150); // Relaxed for CI environment variance
  });

  it('list should complete efficiently', async () => {
    if (!adapter) throw new Error('Adapter not initialized');

    const start = performance.now();
    const workers = await adapter.list({ workerType: 'team' });
    const duration = performance.now() - start;

    expect(workers.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50);
  });
});

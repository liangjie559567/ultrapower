/**
 * Worker Cleanup Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { createWorkerAdapter } from '../../workers/factory.js';

describe('Worker Cleanup Integration', () => {
  const testDir = join(process.cwd(), '.test-cleanup');
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    process.env = originalEnv;
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should cleanup expired workers with default 7 days', async () => {
    const adapter = await createWorkerAdapter('json', testDir);
    expect(adapter).toBeTruthy();

    const oldWorker = {
      workerId: 'old-worker',
      workerType: 'mcp' as const,
      name: 'old',
      status: 'completed' as const,
      spawnedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const recentWorker = {
      workerId: 'recent-worker',
      workerType: 'mcp' as const,
      name: 'recent',
      status: 'completed' as const,
      spawnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await adapter!.upsert(oldWorker);
    await adapter!.upsert(recentWorker);

    const cleaned = await adapter!.cleanup(7 * 24 * 60 * 60 * 1000);
    expect(cleaned).toBe(1);

    const remaining = await adapter!.list();
    expect(remaining.length).toBe(1);
    expect(remaining[0].workerId).toBe('recent-worker');

    await adapter!.close();
  });

  it('should use WORKER_CLEANUP_DAYS environment variable', async () => {
    process.env.WORKER_CLEANUP_DAYS = '3';

    const adapter = await createWorkerAdapter('json', testDir);
    expect(adapter).toBeTruthy();

    const worker = {
      workerId: 'test-worker',
      workerType: 'mcp' as const,
      name: 'test',
      status: 'completed' as const,
      spawnedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await adapter!.upsert(worker);

    const cleanupDays = parseInt(process.env.WORKER_CLEANUP_DAYS || '7', 10);
    const cleaned = await adapter!.cleanup(cleanupDays * 24 * 60 * 60 * 1000);
    expect(cleaned).toBe(1);

    await adapter!.close();
  });

  it('should not cleanup active workers', async () => {
    const adapter = await createWorkerAdapter('json', testDir);
    expect(adapter).toBeTruthy();

    const activeWorker = {
      workerId: 'active-worker',
      workerType: 'mcp' as const,
      name: 'active',
      status: 'running' as const,
      spawnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await adapter!.upsert(activeWorker);

    const cleaned = await adapter!.cleanup(7 * 24 * 60 * 60 * 1000);
    expect(cleaned).toBe(0);

    const remaining = await adapter!.list();
    expect(remaining.length).toBe(1);

    await adapter!.close();
  });
});


/**
 * Cached Worker Adapter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CachedWorkerAdapter } from '../cached-adapter.js';
import type { WorkerStateAdapter } from '../adapter.js';
import type { WorkerState, HealthStatus } from '../types.js';

describe('CachedWorkerAdapter', () => {
  let mockAdapter: WorkerStateAdapter;
  let cachedAdapter: CachedWorkerAdapter;

  beforeEach(() => {
    mockAdapter = {
      init: vi.fn().mockResolvedValue(true),
      upsert: vi.fn().mockResolvedValue(true),
      get: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
      healthCheck: vi.fn().mockResolvedValue({ isAlive: true }),
      batchUpsert: vi.fn().mockResolvedValue(0),
      cleanup: vi.fn().mockResolvedValue(0),
      close: vi.fn().mockResolvedValue(undefined),
    };
    cachedAdapter = new CachedWorkerAdapter(mockAdapter, 5000);
  });

  describe('get with cache', () => {
    it('should return cached worker within TTL', async () => {
      const worker: WorkerState = {
        workerId: 'test-1',
        workerType: 'team',
        name: 'worker1',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
      };

      vi.mocked(mockAdapter.get).mockResolvedValueOnce(worker);

      // First call - cache miss
      const result1 = await cachedAdapter.get('test-1');
      expect(result1).toEqual(worker);
      expect(mockAdapter.get).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      const result2 = await cachedAdapter.get('test-1');
      expect(result2).toEqual(worker);
      expect(mockAdapter.get).toHaveBeenCalledTimes(1);
    });

    it('should fetch from adapter when cache expires', async () => {
      const worker: WorkerState = {
        workerId: 'test-2',
        workerType: 'team',
        name: 'worker2',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
      };

      const shortTtlAdapter = new CachedWorkerAdapter(mockAdapter, 10);
      vi.mocked(mockAdapter.get).mockResolvedValue(worker);

      await shortTtlAdapter.get('test-2');
      await new Promise(resolve => setTimeout(resolve, 15));
      await shortTtlAdapter.get('test-2');

      expect(mockAdapter.get).toHaveBeenCalledTimes(2);
    });

    it('should delete cache entry when worker not found', async () => {
      const worker: WorkerState = {
        workerId: 'test-3',
        workerType: 'team',
        name: 'worker3',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
      };

      const shortTtlAdapter = new CachedWorkerAdapter(mockAdapter, 10);
      vi.mocked(mockAdapter.get).mockResolvedValueOnce(worker).mockResolvedValueOnce(null);

      await shortTtlAdapter.get('test-3');
      await new Promise(resolve => setTimeout(resolve, 15));
      const result = await shortTtlAdapter.get('test-3');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should cache worker on successful upsert', async () => {
      const worker: WorkerState = {
        workerId: 'test-4',
        workerType: 'team',
        name: 'worker4',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
      };

      await cachedAdapter.upsert(worker);
      vi.mocked(mockAdapter.get).mockResolvedValue(worker);

      const result = await cachedAdapter.get('test-4');
      expect(result).toEqual(worker);
      expect(mockAdapter.get).toHaveBeenCalledTimes(0);
    });

    it('should not cache on failed upsert', async () => {
      const worker: WorkerState = {
        workerId: 'test-5',
        workerType: 'team',
        name: 'worker5',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
      };

      vi.mocked(mockAdapter.upsert).mockResolvedValueOnce(false);
      await cachedAdapter.upsert(worker);

      vi.mocked(mockAdapter.get).mockResolvedValue(worker);
      await cachedAdapter.get('test-5');

      expect(mockAdapter.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should remove from cache on successful delete', async () => {
      const worker: WorkerState = {
        workerId: 'test-6',
        workerType: 'team',
        name: 'worker6',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
      };

      await cachedAdapter.upsert(worker);
      await cachedAdapter.delete('test-6');

      vi.mocked(mockAdapter.get).mockResolvedValue(worker);
      await cachedAdapter.get('test-6');

      expect(mockAdapter.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('batchUpsert', () => {
    it('should cache all workers on batch upsert', async () => {
      const workers: WorkerState[] = [
        { workerId: 'batch-1', workerType: 'team', name: 'w1', status: 'idle', spawnedAt: new Date().toISOString() },
        { workerId: 'batch-2', workerType: 'team', name: 'w2', status: 'idle', spawnedAt: new Date().toISOString() },
      ];

      vi.mocked(mockAdapter.batchUpsert).mockResolvedValue(2);
      await cachedAdapter.batchUpsert(workers);

      await cachedAdapter.get('batch-1');
      await cachedAdapter.get('batch-2');

      expect(mockAdapter.get).toHaveBeenCalledTimes(0);
    });
  });

  describe('cleanup', () => {
    it('should clear cache on cleanup', async () => {
      const worker: WorkerState = {
        workerId: 'test-7',
        workerType: 'team',
        name: 'worker7',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
      };

      await cachedAdapter.upsert(worker);
      vi.mocked(mockAdapter.cleanup).mockResolvedValue(1);
      await cachedAdapter.cleanup(10000);

      vi.mocked(mockAdapter.get).mockResolvedValue(worker);
      await cachedAdapter.get('test-7');

      expect(mockAdapter.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    it('should clear cache on close', async () => {
      const worker: WorkerState = {
        workerId: 'test-8',
        workerType: 'team',
        name: 'worker8',
        status: 'idle',
        spawnedAt: new Date().toISOString(),
      };

      await cachedAdapter.upsert(worker);
      await cachedAdapter.close();

      expect(mockAdapter.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('passthrough methods', () => {
    it('should delegate init to inner adapter', async () => {
      await cachedAdapter.init();
      expect(mockAdapter.init).toHaveBeenCalledTimes(1);
    });

    it('should delegate list to inner adapter', async () => {
      await cachedAdapter.list({ status: 'idle' });
      expect(mockAdapter.list).toHaveBeenCalledWith({ status: 'idle' });
    });

    it('should delegate healthCheck to inner adapter', async () => {
      await cachedAdapter.healthCheck('test-id', 5000);
      expect(mockAdapter.healthCheck).toHaveBeenCalledWith('test-id', 5000);
    });
  });
});

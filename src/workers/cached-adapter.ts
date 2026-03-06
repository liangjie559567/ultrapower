/**
 * Cached Worker Adapter - LRU cache wrapper with 5s TTL
 */

import type { WorkerStateAdapter } from './adapter.js';
import type { WorkerState, WorkerFilter, HealthStatus } from './types.js';

interface CacheEntry {
  worker: WorkerState;
  timestamp: number;
}

export class CachedWorkerAdapter implements WorkerStateAdapter {
  private inner: WorkerStateAdapter;
  private cache = new Map<string, CacheEntry>();
  private cacheTtlMs: number;

  constructor(inner: WorkerStateAdapter, cacheTtlMs = 5000) {
    this.inner = inner;
    this.cacheTtlMs = cacheTtlMs;
  }

  async init(): Promise<boolean> {
    return this.inner.init();
  }

  async upsert(worker: WorkerState): Promise<boolean> {
    const success = await this.inner.upsert(worker);
    if (success) {
      this.cache.set(worker.workerId, { worker, timestamp: Date.now() });
    }
    return success;
  }

  async get(workerId: string): Promise<WorkerState | null> {
    const cached = this.cache.get(workerId);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.worker;
    }

    const worker = await this.inner.get(workerId);
    if (worker) {
      this.cache.set(workerId, { worker, timestamp: Date.now() });
    } else {
      this.cache.delete(workerId);
    }
    return worker;
  }

  async list(filter?: WorkerFilter): Promise<WorkerState[]> {
    return this.inner.list(filter);
  }

  async delete(workerId: string): Promise<boolean> {
    const success = await this.inner.delete(workerId);
    if (success) {
      this.cache.delete(workerId);
    }
    return success;
  }

  async healthCheck(workerId: string, maxHeartbeatAge?: number): Promise<HealthStatus> {
    return this.inner.healthCheck(workerId, maxHeartbeatAge);
  }

  async batchUpsert(workers: WorkerState[]): Promise<number> {
    const count = await this.inner.batchUpsert(workers);
    const now = Date.now();
    for (const worker of workers) {
      this.cache.set(worker.workerId, { worker, timestamp: now });
    }
    return count;
  }

  async cleanup(maxAgeMs: number): Promise<number> {
    const count = await this.inner.cleanup(maxAgeMs);
    this.cache.clear();
    return count;
  }

  async close(): Promise<void> {
    this.cache.clear();
    return this.inner.close();
  }
}

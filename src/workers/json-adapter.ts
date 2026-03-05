/**
 * JSON Worker State Adapter
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { WorkerState, WorkerFilter, HealthStatus } from './types.js';
import type { WorkerStateAdapter } from './adapter.js';

export class JsonWorkerAdapter implements WorkerStateAdapter {
  private cwd: string;
  private stateDir: string;

  constructor(cwd: string) {
    this.cwd = cwd;
    this.stateDir = join(cwd, '.omc', 'state', 'workers');
  }

  async init(): Promise<boolean> {
    try {
      if (!existsSync(this.stateDir)) {
        mkdirSync(this.stateDir, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('[JsonWorkerAdapter] Init failed:', error);
      return false;
    }
  }

  async upsert(worker: WorkerState): Promise<boolean> {
    try {
      const filePath = this.getWorkerFilePath(worker.workerId);
      const tempPath = `${filePath}.tmp`;

      writeFileSync(tempPath, JSON.stringify(worker, null, 2), 'utf-8');

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }

      writeFileSync(filePath, readFileSync(tempPath, 'utf-8'));
      unlinkSync(tempPath);

      return true;
    } catch (error) {
      console.error('[JsonWorkerAdapter] Upsert failed:', error);
      return false;
    }
  }

  async get(workerId: string): Promise<WorkerState | null> {
    try {
      const filePath = this.getWorkerFilePath(workerId);
      if (!existsSync(filePath)) return null;

      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as WorkerState;
    } catch (error) {
      console.error('[JsonWorkerAdapter] Get failed:', error);
      return null;
    }
  }

  async list(filter?: WorkerFilter): Promise<WorkerState[]> {
    try {
      if (!existsSync(this.stateDir)) return [];

      const files = readdirSync(this.stateDir).filter(f => f.endsWith('.json'));
      const workers: WorkerState[] = [];

      for (const file of files) {
        try {
          const content = readFileSync(join(this.stateDir, file), 'utf-8');
          const worker = JSON.parse(content) as WorkerState;

          if (this.matchesFilter(worker, filter)) {
            workers.push(worker);
          }
        } catch {
          // Skip corrupted files
        }
      }

      workers.sort((a, b) =>
        new Date(b.spawnedAt).getTime() - new Date(a.spawnedAt).getTime()
      );

      return workers;
    } catch (error) {
      console.error('[JsonWorkerAdapter] List failed:', error);
      return [];
    }
  }

  async delete(workerId: string): Promise<boolean> {
    try {
      const filePath = this.getWorkerFilePath(workerId);
      if (!existsSync(filePath)) return false;

      unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error('[JsonWorkerAdapter] Delete failed:', error);
      return false;
    }
  }

  async healthCheck(workerId: string, maxHeartbeatAge = 30000): Promise<HealthStatus> {
    const worker = await this.get(workerId);
    if (!worker) return { isAlive: false };

    const now = Date.now();
    let heartbeatAge: number | undefined;

    if (worker.lastHeartbeatAt) {
      heartbeatAge = now - new Date(worker.lastHeartbeatAt).getTime();
    }

    const isAlive = worker.status === 'running' || worker.status === 'working'
      ? (heartbeatAge !== undefined && heartbeatAge < maxHeartbeatAge)
      : worker.status !== 'dead';

    const uptimeMs = now - new Date(worker.spawnedAt).getTime();

    return { isAlive, heartbeatAge, lastError: worker.error, uptimeMs };
  }

  async batchUpsert(workers: WorkerState[]): Promise<number> {
    let count = 0;
    for (const worker of workers) {
      if (await this.upsert(worker)) count++;
    }
    return count;
  }

  async cleanup(maxAgeMs: number): Promise<number> {
    try {
      const workers = await this.list();
      let count = 0;

      for (const worker of workers) {
        const isTerminal = ['completed', 'failed', 'timeout', 'dead'].includes(worker.status);
        const timestamp = worker.completedAt || worker.spawnedAt;
        const age = Date.now() - new Date(timestamp).getTime();

        if (isTerminal && age > maxAgeMs) {
          if (await this.delete(worker.workerId)) count++;
        }
      }

      return count;
    } catch (error) {
      console.error('[JsonWorkerAdapter] Cleanup failed:', error);
      return 0;
    }
  }

  async close(): Promise<void> {
    // No resources to clean up
  }

  private getWorkerFilePath(workerId: string): string {
    const safeId = workerId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return join(this.stateDir, `${safeId}.json`);
  }

  private matchesFilter(worker: WorkerState, filter?: WorkerFilter): boolean {
    if (!filter) return true;

    if (filter.workerType && worker.workerType !== filter.workerType) return false;

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      if (!statuses.includes(worker.status)) return false;
    }

    if (filter.teamName && worker.teamName !== filter.teamName) return false;
    if (filter.provider && worker.provider !== filter.provider) return false;

    if (filter.spawnedAfter) {
      const spawnedAt = new Date(worker.spawnedAt);
      if (spawnedAt < filter.spawnedAfter) return false;
    }

    if (filter.spawnedBefore) {
      const spawnedAt = new Date(worker.spawnedAt);
      if (spawnedAt > filter.spawnedBefore) return false;
    }

    return true;
  }
}

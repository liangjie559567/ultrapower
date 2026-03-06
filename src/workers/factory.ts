/**
 * Worker Adapter Factory
 */

import type { WorkerStateAdapter } from './adapter.js';
import { SqliteWorkerAdapter } from './sqlite-adapter.js';
import { JsonWorkerAdapter } from './json-adapter.js';
import { CachedWorkerAdapter } from './cached-adapter.js';

export type AdapterType = 'sqlite' | 'json' | 'auto';

export interface AdapterOptions {
  enableCache?: boolean;
  cacheTtlMs?: number;
}

export async function createWorkerAdapter(
  type: AdapterType,
  cwd: string,
  options: AdapterOptions = {}
): Promise<WorkerStateAdapter | null> {
  try {
    let adapter: WorkerStateAdapter;

    if (type === 'auto') {
      try {
        adapter = new SqliteWorkerAdapter(cwd);
        const success = await adapter.init();
        if (success) {
          console.log('[WorkerFactory] Using SQLite adapter');
          return wrapWithCache(adapter, options);
        }
      } catch {
        // Fallback to JSON
      }

      adapter = new JsonWorkerAdapter(cwd);
      const success = await adapter.init();
      if (success) {
        console.log('[WorkerFactory] Using JSON adapter (SQLite unavailable)');
        return wrapWithCache(adapter, options);
      }
    } else if (type === 'sqlite') {
      adapter = new SqliteWorkerAdapter(cwd);
      const success = await adapter.init();
      if (success) return wrapWithCache(adapter, options);
    } else if (type === 'json') {
      adapter = new JsonWorkerAdapter(cwd);
      const success = await adapter.init();
      if (success) return wrapWithCache(adapter, options);
    }

    return null;
  } catch (error) {
    console.error('[WorkerFactory] Failed to create adapter:', error);
    return null;
  }
}

function wrapWithCache(adapter: WorkerStateAdapter, options: AdapterOptions): WorkerStateAdapter {
  if (options.enableCache === false) {
    return adapter;
  }
  return new CachedWorkerAdapter(adapter, options.cacheTtlMs);
}

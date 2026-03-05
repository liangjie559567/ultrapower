/**
 * Worker Adapter Factory
 */

import type { WorkerStateAdapter } from './adapter.js';
import { SqliteWorkerAdapter } from './sqlite-adapter.js';
import { JsonWorkerAdapter } from './json-adapter.js';

export type AdapterType = 'sqlite' | 'json' | 'auto';

export async function createWorkerAdapter(
  type: AdapterType,
  cwd: string
): Promise<WorkerStateAdapter | null> {
  try {
    let adapter: WorkerStateAdapter;

    if (type === 'auto') {
      try {
        adapter = new SqliteWorkerAdapter(cwd);
        const success = await adapter.init();
        if (success) {
          console.log('[WorkerFactory] Using SQLite adapter');
          return adapter;
        }
      } catch {
        // Fallback to JSON
      }

      adapter = new JsonWorkerAdapter(cwd);
      const success = await adapter.init();
      if (success) {
        console.log('[WorkerFactory] Using JSON adapter (SQLite unavailable)');
        return adapter;
      }
    } else if (type === 'sqlite') {
      adapter = new SqliteWorkerAdapter(cwd);
      const success = await adapter.init();
      if (success) return adapter;
    } else if (type === 'json') {
      adapter = new JsonWorkerAdapter(cwd);
      const success = await adapter.init();
      if (success) return adapter;
    }

    return null;
  } catch (error) {
    console.error('[WorkerFactory] Failed to create adapter:', error);
    return null;
  }
}

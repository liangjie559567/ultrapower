/**
 * Worker Adapter Factory
 */
import type { WorkerStateAdapter } from './adapter.js';
export type AdapterType = 'sqlite' | 'json' | 'auto';
export interface AdapterOptions {
    enableCache?: boolean;
    cacheTtlMs?: number;
}
export declare function createWorkerAdapter(type: AdapterType, cwd: string, options?: AdapterOptions): Promise<WorkerStateAdapter | null>;
//# sourceMappingURL=factory.d.ts.map
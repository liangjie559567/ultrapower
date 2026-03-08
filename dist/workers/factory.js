/**
 * Worker Adapter Factory
 */
import { SqliteWorkerAdapter } from './sqlite-adapter.js';
import { JsonWorkerAdapter } from './json-adapter.js';
import { CachedWorkerAdapter } from './cached-adapter.js';
export async function createWorkerAdapter(type, cwd, options = {}) {
    try {
        let adapter;
        if (type === 'auto') {
            try {
                adapter = new SqliteWorkerAdapter(cwd);
                const success = await adapter.init();
                if (success) {
                    console.log('[WorkerFactory] Using SQLite adapter');
                    return wrapWithCache(adapter, options);
                }
            }
            catch {
                // Fallback to JSON
            }
            adapter = new JsonWorkerAdapter(cwd);
            const success = await adapter.init();
            if (success) {
                console.log('[WorkerFactory] Using JSON adapter (SQLite unavailable)');
                return wrapWithCache(adapter, options);
            }
        }
        else if (type === 'sqlite') {
            adapter = new SqliteWorkerAdapter(cwd);
            const success = await adapter.init();
            if (success)
                return wrapWithCache(adapter, options);
        }
        else if (type === 'json') {
            adapter = new JsonWorkerAdapter(cwd);
            const success = await adapter.init();
            if (success)
                return wrapWithCache(adapter, options);
        }
        return null;
    }
    catch (error) {
        console.error('[WorkerFactory] Failed to create adapter:', error);
        return null;
    }
}
function wrapWithCache(adapter, options) {
    if (options.enableCache === false) {
        return adapter;
    }
    return new CachedWorkerAdapter(adapter, options.cacheTtlMs);
}
//# sourceMappingURL=factory.js.map
/**
 * Cached Worker Adapter - LRU cache wrapper with 5s TTL
 */
export class CachedWorkerAdapter {
    inner;
    cache = new Map();
    cacheTtlMs;
    constructor(inner, cacheTtlMs = 5000) {
        this.inner = inner;
        this.cacheTtlMs = cacheTtlMs;
    }
    async init() {
        return this.inner.init();
    }
    async upsert(worker) {
        const success = await this.inner.upsert(worker);
        if (success) {
            this.cache.set(worker.workerId, { worker, timestamp: Date.now() });
        }
        return success;
    }
    async get(workerId) {
        const cached = this.cache.get(workerId);
        if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
            return cached.worker;
        }
        const worker = await this.inner.get(workerId);
        if (worker) {
            this.cache.set(workerId, { worker, timestamp: Date.now() });
        }
        else {
            this.cache.delete(workerId);
        }
        return worker;
    }
    async list(filter) {
        return this.inner.list(filter);
    }
    async delete(workerId) {
        const success = await this.inner.delete(workerId);
        if (success) {
            this.cache.delete(workerId);
        }
        return success;
    }
    async healthCheck(workerId, maxHeartbeatAge) {
        return this.inner.healthCheck(workerId, maxHeartbeatAge);
    }
    async batchUpsert(workers) {
        const count = await this.inner.batchUpsert(workers);
        const now = Date.now();
        for (const worker of workers) {
            this.cache.set(worker.workerId, { worker, timestamp: now });
        }
        return count;
    }
    async cleanup(maxAgeMs) {
        const count = await this.inner.cleanup(maxAgeMs);
        this.cache.clear();
        return count;
    }
    async close() {
        this.cache.clear();
        return this.inner.close();
    }
}
//# sourceMappingURL=cached-adapter.js.map
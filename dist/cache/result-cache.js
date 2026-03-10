export class ResultCache {
    maxSize;
    ttlMs;
    cache = new Map();
    accessOrder = [];
    hits = 0;
    misses = 0;
    constructor(maxSize = 1000, ttlMs = 300000) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }
    set(key, value, userId) {
        const fullKey = `${userId}:${key}`;
        if (this.cache.size >= this.maxSize && !this.cache.has(fullKey)) {
            const oldest = this.accessOrder.shift();
            if (oldest)
                this.cache.delete(oldest);
        }
        this.cache.set(fullKey, {
            value,
            expiry: Date.now() + this.ttlMs,
            userId
        });
        const idx = this.accessOrder.indexOf(fullKey);
        if (idx > -1)
            this.accessOrder.splice(idx, 1);
        this.accessOrder.push(fullKey);
    }
    get(key, userId) {
        const fullKey = `${userId}:${key}`;
        const entry = this.cache.get(fullKey);
        if (!entry) {
            this.misses++;
            return null;
        }
        if (Date.now() > entry.expiry || entry.userId !== userId) {
            this.cache.delete(fullKey);
            this.misses++;
            return null;
        }
        this.hits++;
        const idx = this.accessOrder.indexOf(fullKey);
        if (idx > -1) {
            this.accessOrder.splice(idx, 1);
            this.accessOrder.push(fullKey);
        }
        return entry.value;
    }
    getStats() {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0
        };
    }
    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.hits = 0;
        this.misses = 0;
    }
}
//# sourceMappingURL=result-cache.js.map
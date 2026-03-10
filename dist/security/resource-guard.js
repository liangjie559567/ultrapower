/**
 * T-020: Resource Exhaustion Protection
 * - Rate limiting
 * - Concurrency limiting
 * - Disk quota checking
 */
export class ResourceGuard {
    config;
    rates = new Map();
    concurrency = new Map();
    constructor(config) {
        this.config = config;
    }
    checkRateLimit(userId, operation) {
        const key = `${userId}:${operation}`;
        const now = Date.now();
        const record = this.rates.get(key) || {
            second: { count: 0, timestamp: now },
            minute: { count: 0, timestamp: now },
        };
        // Reset counters if time window passed
        if (now - record.second.timestamp >= 1000) {
            record.second = { count: 0, timestamp: now };
        }
        if (now - record.minute.timestamp >= 60000) {
            record.minute = { count: 0, timestamp: now };
        }
        // Check limits
        if (this.config.rateLimit?.perSecond && record.second.count >= this.config.rateLimit.perSecond) {
            throw new Error(`Rate limit exceeded: ${this.config.rateLimit.perSecond}/sec`);
        }
        if (this.config.rateLimit?.perMinute && record.minute.count >= this.config.rateLimit.perMinute) {
            throw new Error(`Rate limit exceeded: ${this.config.rateLimit.perMinute}/min`);
        }
        // Increment counters
        record.second.count++;
        record.minute.count++;
        this.rates.set(key, record);
    }
    acquireConcurrencySlot(userId) {
        const current = this.concurrency.get(userId) || 0;
        if (this.config.maxConcurrency && current >= this.config.maxConcurrency) {
            throw new Error(`Concurrency limit exceeded: ${this.config.maxConcurrency}`);
        }
        this.concurrency.set(userId, current + 1);
    }
    releaseConcurrencySlot(userId) {
        const current = this.concurrency.get(userId) || 0;
        this.concurrency.set(userId, Math.max(0, current - 1));
    }
    checkDiskQuota(userId, usedMB) {
        if (this.config.diskQuotaMB && usedMB > this.config.diskQuotaMB) {
            throw new Error(`Disk quota exceeded: ${usedMB}MB/${this.config.diskQuotaMB}MB`);
        }
    }
}
//# sourceMappingURL=resource-guard.js.map
/**
 * Cache Security Boundary
 * T-016: User isolation + permission validation + quota management
 */
export class CacheSecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CacheSecurityError';
    }
}
export class CacheSecurity {
    quota;
    usage = new Map();
    constructor(quota = { maxBytes: 10 * 1024 * 1024 }) {
        this.quota = quota;
    }
    validateAccess(userId, _key) {
        if (!userId || userId.includes('..') || userId.includes('/')) {
            throw new CacheSecurityError('Invalid userId');
        }
    }
    isolateKey(userId, key) {
        this.validateAccess(userId, key);
        return `user:${userId}:${key}`;
    }
    checkQuota(userId, bytes) {
        const current = this.usage.get(userId) || 0;
        if (current + bytes > this.quota.maxBytes) {
            throw new CacheSecurityError(`Quota exceeded for user ${userId}`);
        }
    }
    trackUsage(userId, bytes) {
        this.usage.set(userId, (this.usage.get(userId) || 0) + bytes);
    }
    getUsage(userId) {
        return this.usage.get(userId) || 0;
    }
}
//# sourceMappingURL=security.js.map
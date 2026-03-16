/**
 * T-019: Concurrency Control Mechanism
 * - Version checking
 * - Conflict retry with exponential backoff
 * - Deadlock detection
 */
const DEFAULT_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 100,
    deadlockTimeoutMs: 30000,
};
export class ConcurrencyControl {
    locks = new Map();
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Version check: ensure state hasn't changed
     */
    checkVersion(current, expected) {
        if (current !== expected) {
            throw new Error(`Version conflict: expected ${expected}, got ${current}`);
        }
    }
    /**
     * Retry with exponential backoff on conflict
     */
    async retryOnConflict(operation, resourceId) {
        let lastError;
        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('Version conflict')) {
                    lastError = error;
                    const delay = this.config.baseDelayMs * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
        throw new Error(`Max retries (${this.config.maxRetries}) exceeded for ${resourceId}: ${lastError?.message}`);
    }
    /**
     * Acquire lock with deadlock detection
     */
    async acquireLock(resourceId, holderId) {
        const existing = this.locks.get(resourceId);
        if (existing) {
            const elapsed = Date.now() - existing.timestamp;
            if (elapsed > this.config.deadlockTimeoutMs) {
                // Deadlock detected, force release
                this.locks.delete(resourceId);
            }
            else if (existing.holder !== holderId) {
                throw new Error(`Resource ${resourceId} locked by ${existing.holder}`);
            }
        }
        this.locks.set(resourceId, { holder: holderId, timestamp: Date.now() });
    }
    /**
     * Release lock
     */
    releaseLock(resourceId, holderId) {
        const existing = this.locks.get(resourceId);
        if (existing && existing.holder === holderId) {
            this.locks.delete(resourceId);
        }
    }
    /**
     * Check for deadlocks
     */
    detectDeadlocks() {
        const deadlocked = [];
        const now = Date.now();
        for (const [resourceId, lock] of this.locks.entries()) {
            if (now - lock.timestamp > this.config.deadlockTimeoutMs) {
                deadlocked.push(resourceId);
            }
        }
        return deadlocked;
    }
}
// Singleton instance for global lock management
const globalControl = new ConcurrencyControl();
export async function acquireLock(resourceId, timeoutMs = 5000, controller = globalControl) {
    const holderId = `${process.pid}-${Date.now()}-${Math.random()}`;
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            controller.acquireLock(resourceId, holderId);
            return { resourceId, holderId, controller };
        }
        catch (err) {
            if (Date.now() - startTime >= timeoutMs) {
                throw err;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    throw new Error(`Failed to acquire lock for ${resourceId} within ${timeoutMs}ms`);
}
export async function releaseLock(lock) {
    lock.controller.releaseLock(lock.resourceId, lock.holderId);
}
//# sourceMappingURL=concurrency-control.js.map
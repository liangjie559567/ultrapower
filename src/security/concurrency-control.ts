/**
 * T-019: Concurrency Control Mechanism
 * - Version checking
 * - Conflict retry with exponential backoff
 * - Deadlock detection
 */

export interface VersionedState {
  version: number;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ConcurrencyConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  deadlockTimeoutMs?: number;
}

const DEFAULT_CONFIG: Required<ConcurrencyConfig> = {
  maxRetries: 3,
  baseDelayMs: 100,
  deadlockTimeoutMs: 30000,
};

export class ConcurrencyControl {
  private locks = new Map<string, { holder: string; timestamp: number }>();
  private config: Required<ConcurrencyConfig>;

  constructor(config: ConcurrencyConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Version check: ensure state hasn't changed
   */
  checkVersion(current: number, expected: number): void {
    if (current !== expected) {
      throw new Error(`Version conflict: expected ${expected}, got ${current}`);
    }
  }

  /**
   * Retry with exponential backoff on conflict
   */
  async retryOnConflict<T>(
    operation: () => Promise<T>,
    resourceId: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Version conflict')) {
          lastError = error;
          const delay = this.config.baseDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      `Max retries (${this.config.maxRetries}) exceeded for ${resourceId}: ${lastError?.message}`
    );
  }

  /**
   * Acquire lock with deadlock detection
   */
  async acquireLock(resourceId: string, holderId: string): Promise<void> {
    const existing = this.locks.get(resourceId);

    if (existing) {
      const elapsed = Date.now() - existing.timestamp;

      if (elapsed > this.config.deadlockTimeoutMs) {
        // Deadlock detected, force release
        this.locks.delete(resourceId);
      } else if (existing.holder !== holderId) {
        throw new Error(`Resource ${resourceId} locked by ${existing.holder}`);
      }
    }

    this.locks.set(resourceId, { holder: holderId, timestamp: Date.now() });
  }

  /**
   * Release lock
   */
  releaseLock(resourceId: string, holderId: string): void {
    const existing = this.locks.get(resourceId);

    if (existing && existing.holder === holderId) {
      this.locks.delete(resourceId);
    }
  }

  /**
   * Check for deadlocks
   */
  detectDeadlocks(): string[] {
    const deadlocked: string[] = [];
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

export interface Lock {
  resourceId: string;
  holderId: string;
  controller: ConcurrencyControl;
}

export async function acquireLock(resourceId: string, timeoutMs: number = 5000, controller: ConcurrencyControl = globalControl): Promise<Lock> {
  const holderId = `${process.pid}-${Date.now()}-${Math.random()}`;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      controller.acquireLock(resourceId, holderId);
      return { resourceId, holderId, controller };
    } catch (err) {
      if (Date.now() - startTime >= timeoutMs) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  throw new Error(`Failed to acquire lock for ${resourceId} within ${timeoutMs}ms`);
}

export async function releaseLock(lock: Lock): Promise<void> {
  lock.controller.releaseLock(lock.resourceId, lock.holderId);
}

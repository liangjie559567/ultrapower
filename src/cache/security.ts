/**
 * Cache Security Boundary
 * T-016: User isolation + permission validation + quota management
 */

export class CacheSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheSecurityError';
  }
}

export interface CacheQuota {
  maxBytes: number;
}

export class CacheSecurity {
  private usage = new Map<string, number>();

  constructor(private quota: CacheQuota = { maxBytes: 10 * 1024 * 1024 }) {}

  validateAccess(userId: string, _key: string): void {
    if (!userId || userId.includes('..') || userId.includes('/')) {
      throw new CacheSecurityError('Invalid userId');
    }
  }

  isolateKey(userId: string, key: string): string {
    this.validateAccess(userId, key);
    return `user:${userId}:${key}`;
  }

  checkQuota(userId: string, bytes: number): void {
    const current = this.usage.get(userId) || 0;
    if (current + bytes > this.quota.maxBytes) {
      throw new CacheSecurityError(`Quota exceeded for user ${userId}`);
    }
  }

  trackUsage(userId: string, bytes: number): void {
    this.usage.set(userId, (this.usage.get(userId) || 0) + bytes);
  }

  getUsage(userId: string): number {
    return this.usage.get(userId) || 0;
  }
}

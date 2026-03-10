/**
 * T-020: Resource Exhaustion Protection
 * - Rate limiting
 * - Concurrency limiting
 * - Disk quota checking
 */
export interface ResourceConfig {
    rateLimit?: {
        perSecond?: number;
        perMinute?: number;
    };
    maxConcurrency?: number;
    diskQuotaMB?: number;
}
export declare class ResourceGuard {
    private config;
    private rates;
    private concurrency;
    constructor(config: ResourceConfig);
    checkRateLimit(userId: string, operation: string): void;
    acquireConcurrencySlot(userId: string): void;
    releaseConcurrencySlot(userId: string): void;
    checkDiskQuota(userId: string, usedMB: number): void;
}
//# sourceMappingURL=resource-guard.d.ts.map
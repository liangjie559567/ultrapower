/**
 * Cache Security Boundary
 * T-016: User isolation + permission validation + quota management
 */
export declare class CacheSecurityError extends Error {
    constructor(message: string);
}
export interface CacheQuota {
    maxBytes: number;
}
export declare class CacheSecurity {
    private quota;
    private usage;
    constructor(quota?: CacheQuota);
    validateAccess(userId: string, _key: string): void;
    isolateKey(userId: string, key: string): string;
    checkQuota(userId: string, bytes: number): void;
    trackUsage(userId: string, bytes: number): void;
    getUsage(userId: string): number;
}
//# sourceMappingURL=security.d.ts.map
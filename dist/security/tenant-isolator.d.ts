/**
 * T-021: Multi-tenant Resource Isolation
 * - ResourceQuota enforcement
 * - Tenant isolation
 * - Resource usage monitoring
 */
export interface ResourceQuota {
    maxMemory: number;
    maxCPU: number;
    maxDisk: number;
}
export interface ResourceUsage {
    memory: number;
    cpu: number;
    disk: number;
}
export declare class TenantIsolator {
    private quotas;
    private usage;
    private guards;
    private concurrency;
    enforceQuota(userId: string, quota: ResourceQuota): void;
    checkResourceUsage(userId: string): ResourceUsage;
    isolateTenant(userId: string): void;
    updateUsage(userId: string, usage: Partial<ResourceUsage>): void;
}
//# sourceMappingURL=tenant-isolator.d.ts.map
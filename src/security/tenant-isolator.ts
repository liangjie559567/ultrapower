/**
 * T-021: Multi-tenant Resource Isolation
 * - ResourceQuota enforcement
 * - Tenant isolation
 * - Resource usage monitoring
 */

import { ResourceGuard, ResourceConfig } from './resource-guard.js';
import { ConcurrencyControl } from './concurrency-control.js';

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

export class TenantIsolator {
  private quotas = new Map<string, ResourceQuota>();
  private usage = new Map<string, ResourceUsage>();
  private guards = new Map<string, ResourceGuard>();
  private concurrency = new ConcurrencyControl();

  enforceQuota(userId: string, quota: ResourceQuota): void {
    this.quotas.set(userId, quota);
    this.guards.set(userId, new ResourceGuard({
      maxConcurrency: 10,
      diskQuotaMB: quota.maxDisk,
      rateLimit: { perSecond: 100, perMinute: 1000 }
    }));
  }

  checkResourceUsage(userId: string): ResourceUsage {
    const usage = this.usage.get(userId);
    if (!usage) {
      throw new Error(`No usage data for user ${userId}`);
    }

    const quota = this.quotas.get(userId);
    if (!quota) {
      throw new Error(`No quota set for user ${userId}`);
    }

    if (usage.memory > quota.maxMemory) {
      throw new Error(`Memory quota exceeded: ${usage.memory}MB/${quota.maxMemory}MB`);
    }
    if (usage.cpu > quota.maxCPU) {
      throw new Error(`CPU quota exceeded: ${usage.cpu}%/${quota.maxCPU}%`);
    }
    if (usage.disk > quota.maxDisk) {
      throw new Error(`Disk quota exceeded: ${usage.disk}MB/${quota.maxDisk}MB`);
    }

    return usage;
  }

  isolateTenant(userId: string): void {
    if (!this.usage.has(userId)) {
      this.usage.set(userId, { memory: 0, cpu: 0, disk: 0 });
    }
  }

  updateUsage(userId: string, usage: Partial<ResourceUsage>): void {
    const current = this.usage.get(userId) || { memory: 0, cpu: 0, disk: 0 };
    this.usage.set(userId, { ...current, ...usage });
  }
}

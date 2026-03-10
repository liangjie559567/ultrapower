import { describe, test, expect, beforeEach } from 'vitest';
import { TenantIsolator } from '../../src/security/tenant-isolator';

describe('TenantIsolator', () => {
  let isolator: TenantIsolator;

  beforeEach(() => {
    isolator = new TenantIsolator();
  });

  test('enforces quota', () => {
    isolator.enforceQuota('user1', { maxMemory: 100, maxCPU: 50, maxDisk: 200 });
    isolator.isolateTenant('user1');
    isolator.updateUsage('user1', { memory: 150, cpu: 30, disk: 100 });

    expect(() => isolator.checkResourceUsage('user1')).toThrow('Memory quota exceeded');
  });

  test('isolates tenants', () => {
    isolator.enforceQuota('user1', { maxMemory: 100, maxCPU: 50, maxDisk: 200 });
    isolator.enforceQuota('user2', { maxMemory: 100, maxCPU: 50, maxDisk: 200 });

    isolator.isolateTenant('user1');
    isolator.isolateTenant('user2');

    isolator.updateUsage('user1', { memory: 90, cpu: 40, disk: 150 });
    isolator.updateUsage('user2', { memory: 20, cpu: 10, disk: 50 });

    const usage1 = isolator.checkResourceUsage('user1');
    const usage2 = isolator.checkResourceUsage('user2');

    expect(usage1.memory).toBe(90);
    expect(usage2.memory).toBe(20);
  });

  test('monitors resource usage', () => {
    isolator.enforceQuota('user1', { maxMemory: 100, maxCPU: 50, maxDisk: 200 });
    isolator.isolateTenant('user1');
    isolator.updateUsage('user1', { memory: 50, cpu: 25, disk: 100 });

    const usage = isolator.checkResourceUsage('user1');
    expect(usage).toEqual({ memory: 50, cpu: 25, disk: 100 });
  });
});

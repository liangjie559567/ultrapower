import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceGuard } from '../../src/security/resource-guard';

describe('ResourceGuard', () => {
  let guard: ResourceGuard;

  beforeEach(() => {
    guard = new ResourceGuard({
      rateLimit: { perSecond: 2, perMinute: 5 },
      maxConcurrency: 3,
      diskQuotaMB: 100,
    });
  });

  describe('checkRateLimit', () => {
    it('allows operations within rate limit', () => {
      expect(() => guard.checkRateLimit('user1', 'op1')).not.toThrow();
      expect(() => guard.checkRateLimit('user1', 'op1')).not.toThrow();
    });

    it('rejects operations exceeding per-second limit', () => {
      guard.checkRateLimit('user1', 'op1');
      guard.checkRateLimit('user1', 'op1');
      expect(() => guard.checkRateLimit('user1', 'op1')).toThrow('Rate limit exceeded: 2/sec');
    });
  });

  describe('acquireConcurrencySlot', () => {
    it('allows acquiring slots within limit', () => {
      expect(() => guard.acquireConcurrencySlot('user1')).not.toThrow();
      expect(() => guard.acquireConcurrencySlot('user1')).not.toThrow();
    });

    it('rejects acquiring slots exceeding limit', () => {
      guard.acquireConcurrencySlot('user1');
      guard.acquireConcurrencySlot('user1');
      guard.acquireConcurrencySlot('user1');
      expect(() => guard.acquireConcurrencySlot('user1')).toThrow('Concurrency limit exceeded: 3');
    });
  });

  describe('releaseConcurrencySlot', () => {
    it('releases slot correctly', () => {
      guard.acquireConcurrencySlot('user1');
      guard.acquireConcurrencySlot('user1');
      guard.releaseConcurrencySlot('user1');
      expect(() => guard.acquireConcurrencySlot('user1')).not.toThrow();
    });
  });

  describe('checkDiskQuota', () => {
    it('allows usage within quota', () => {
      expect(() => guard.checkDiskQuota('user1', 50)).not.toThrow();
    });

    it('rejects usage exceeding quota', () => {
      expect(() => guard.checkDiskQuota('user1', 150)).toThrow('Disk quota exceeded: 150MB/100MB');
    });
  });
});

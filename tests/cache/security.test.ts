import { describe, it, expect } from 'vitest';
import { CacheSecurity, CacheSecurityError } from '../../src/cache/security.js';

describe('Cache Security', () => {
  it('isolates keys by userId', () => {
    const security = new CacheSecurity();
    expect(security.isolateKey('user1', 'key1')).toBe('user:user1:key1');
    expect(security.isolateKey('user2', 'key1')).toBe('user:user2:key1');
  });

  it('rejects path traversal in userId', () => {
    const security = new CacheSecurity();
    expect(() => security.validateAccess('../etc', 'key')).toThrow(CacheSecurityError);
  });

  it('enforces quota limits', () => {
    const security = new CacheSecurity({ maxBytes: 100 });
    security.trackUsage('user1', 50);
    expect(() => security.checkQuota('user1', 60)).toThrow(CacheSecurityError);
  });

  it('allows writes within quota', () => {
    const security = new CacheSecurity({ maxBytes: 100 });
    security.trackUsage('user1', 50);
    expect(() => security.checkQuota('user1', 40)).not.toThrow();
  });

  it('tracks usage per user', () => {
    const security = new CacheSecurity();
    security.trackUsage('user1', 100);
    security.trackUsage('user2', 200);
    expect(security.getUsage('user1')).toBe(100);
    expect(security.getUsage('user2')).toBe(200);
  });
});

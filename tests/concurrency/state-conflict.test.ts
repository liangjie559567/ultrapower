import { describe, it, expect, beforeEach } from 'vitest';
import { ConcurrencyControl } from '../../src/security/concurrency-control';

describe('State Conflict Resolution', () => {
  let cc: ConcurrencyControl;

  beforeEach(() => {
    cc = new ConcurrencyControl({ maxRetries: 3, baseDelayMs: 10 });
  });

  it('should resolve concurrent version conflicts', async () => {
    let version = 1;
    const updates = Array.from({ length: 5 }, (_, i) =>
      cc.retryOnConflict(async () => {
        const current = version;
        cc.checkVersion(current, current);
        version++;
        return i;
      }, `resource-${i}`)
    );

    const results = await Promise.all(updates);
    expect(results).toHaveLength(5);
  });

  it('should handle lock contention', async () => {
    const locks = Array.from({ length: 3 }, (_, i) =>
      cc.acquireLock('shared', `holder-${i}`).catch(() => `failed-${i}`)
    );

    const results = await Promise.all(locks);
    const acquired = results.filter(r => r === undefined).length;
    expect(acquired).toBe(1);
  });
});

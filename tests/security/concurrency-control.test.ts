import { describe, it, expect, beforeEach } from 'vitest';
import { ConcurrencyControl } from '../../src/security/concurrency-control';

describe('ConcurrencyControl', () => {
  let cc: ConcurrencyControl;

  beforeEach(() => {
    cc = new ConcurrencyControl({ maxRetries: 3, baseDelayMs: 10, deadlockTimeoutMs: 1000 });
  });

  describe('Version checking', () => {
    it('should pass when versions match', () => {
      expect(() => cc.checkVersion(1, 1)).not.toThrow();
    });

    it('should throw on version mismatch', () => {
      expect(() => cc.checkVersion(2, 1)).toThrow('Version conflict');
    });
  });

  describe('Conflict retry', () => {
    it('should succeed on first attempt', async () => {
      const result = await cc.retryOnConflict(async () => 'success', 'resource1');
      expect(result).toBe('success');
    });

    it('should retry on version conflict', async () => {
      let attempts = 0;
      const result = await cc.retryOnConflict(async () => {
        attempts++;
        if (attempts < 2) throw new Error('Version conflict: test');
        return 'success';
      }, 'resource1');

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should fail after max retries', async () => {
      await expect(
        cc.retryOnConflict(async () => {
          throw new Error('Version conflict: persistent');
        }, 'resource1')
      ).rejects.toThrow('Max retries');
    });
  });

  describe('Lock management', () => {
    it('should acquire and release lock', async () => {
      await cc.acquireLock('res1', 'holder1');
      cc.releaseLock('res1', 'holder1');
      await cc.acquireLock('res1', 'holder2');
    });

    it('should prevent concurrent access', async () => {
      await cc.acquireLock('res1', 'holder1');
      await expect(cc.acquireLock('res1', 'holder2')).rejects.toThrow('locked by');
    });

    it('should allow same holder to reacquire', async () => {
      await cc.acquireLock('res1', 'holder1');
      await expect(cc.acquireLock('res1', 'holder1')).resolves.toBeUndefined();
    });
  });

  describe('Deadlock detection', () => {
    it('should detect no deadlocks initially', () => {
      expect(cc.detectDeadlocks()).toEqual([]);
    });

    it('should detect deadlocked resources', async () => {
      const shortTimeout = new ConcurrencyControl({ deadlockTimeoutMs: 50 });
      await shortTimeout.acquireLock('res1', 'holder1');

      await new Promise(resolve => setTimeout(resolve, 60));

      const deadlocked = shortTimeout.detectDeadlocks();
      expect(deadlocked).toContain('res1');
    });

    it('should auto-release on deadlock timeout', async () => {
      const shortTimeout = new ConcurrencyControl({ deadlockTimeoutMs: 50 });
      await shortTimeout.acquireLock('res1', 'holder1');

      await new Promise(resolve => setTimeout(resolve, 60));

      await expect(shortTimeout.acquireLock('res1', 'holder2')).resolves.toBeUndefined();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as os from 'os';

// Mock fs with hoisted functions
const mockOpen = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());
const mockUnlink = vi.hoisted(() => vi.fn());
const mockLstat = vi.hoisted(() => vi.fn());

vi.mock('fs/promises', () => ({
  open: mockOpen,
  readFile: mockReadFile,
  unlink: mockUnlink,
  lstat: mockLstat,
}));

vi.mock('fs', () => ({
  constants: {
    O_WRONLY: 1,
    O_CREAT: 64,
    O_EXCL: 128,
    O_NOFOLLOW: 256,
  },
}));

// Mock child_process
vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

// Mock paths
vi.mock('../paths.js', () => ({
  getSessionLockPath: (sessionId: string) => `/tmp/.omc/python-repl/${sessionId}/session.lock`,
}));

// Mock atomic-write
vi.mock('../../../lib/atomic-write.js', () => ({
  ensureDirSync: vi.fn(),
}));

// Mock platform
const mockGetProcessStartTime = vi.hoisted(() => vi.fn());
vi.mock('../../../platform/index.js', () => ({
  getProcessStartTime: mockGetProcessStartTime,
}));

import {
  SessionLock,
  LockTimeoutError,
  LockError as _LockError,
  withLock,
  getLockStatus,
  isProcessAlive,
} from '../session-lock.js';

describe('SessionLock', () => {
  const testSessionId = 'test-session-123';
  const testLockPath = `/tmp/.omc/python-repl/${testSessionId}/session.lock`;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProcessStartTime.mockResolvedValue(1234567890);
  });

  describe('acquire and release', () => {
    it('should acquire and release lock successfully', async () => {
      let writtenContent = '';
      const mockFileHandle = {
        writeFile: vi.fn().mockImplementation((content) => {
          writtenContent = content;
          return Promise.resolve(undefined);
        }),
        sync: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile
        .mockRejectedValueOnce({ code: 'ENOENT' })
        .mockImplementation(() => Promise.resolve(writtenContent));
      mockOpen.mockResolvedValue(mockFileHandle);
      mockUnlink.mockResolvedValue(undefined);

      const lock = new SessionLock(testSessionId);
      const result = await lock.tryAcquire();

      expect(result.acquired).toBe(true);
      expect(lock.isHeld()).toBe(true);

      await lock.release();
      expect(lock.isHeld()).toBe(false);
    });

    it('should not release if lock not held', async () => {
      const lock = new SessionLock(testSessionId);
      await lock.release();

      expect(mockUnlink).not.toHaveBeenCalled();
    });
  });

  describe('withLock helper', () => {
    it('should execute function with lock', async () => {
      let writtenContent = '';
      const mockFileHandle = {
        writeFile: vi.fn().mockImplementation((content) => {
          writtenContent = content;
          return Promise.resolve(undefined);
        }),
        sync: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile
        .mockRejectedValueOnce({ code: 'ENOENT' })
        .mockImplementation(() => Promise.resolve(writtenContent));
      mockOpen.mockResolvedValue(mockFileHandle);
      mockUnlink.mockResolvedValue(undefined);

      const fn = vi.fn().mockResolvedValue('result');
      const result = await withLock(testSessionId, fn, 200);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
      expect(mockUnlink).toHaveBeenCalled();
    });
  });

  describe('timeout handling', () => {
    it('should timeout when lock cannot be acquired', async () => {
      const existingLock = {
        lockId: 'other-lock',
        pid: 99999,
        processStartTime: 1234567890,
        hostname: os.hostname(),
        acquiredAt: new Date().toISOString(),
      };

      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockResolvedValue(JSON.stringify(existingLock));
      mockGetProcessStartTime.mockResolvedValue(1234567890);

      const lock = new SessionLock(testSessionId);
      await expect(lock.acquire(200)).rejects.toThrow(LockTimeoutError);
    }, 10000);
  });

  describe('concurrent lock competition', () => {
    it('should handle EEXIST when another process creates lock first', async () => {
      mockLstat.mockRejectedValue({ code: 'ENOENT' });
      mockReadFile.mockRejectedValue({ code: 'ENOENT' });
      mockOpen.mockRejectedValue({ code: 'EEXIST' });

      const lock = new SessionLock(testSessionId);
      const result = await lock.tryAcquire();

      expect(result.acquired).toBe(false);
      expect(result.reason).toBe('held_by_other');
    });

    it('should reject symlink lock files', async () => {
      mockLstat.mockResolvedValue({ isSymbolicLink: () => true });

      const lock = new SessionLock(testSessionId);
      const result = await lock.tryAcquire();

      expect(result.acquired).toBe(false);
    });

    it('should detect lock ID mismatch after write', async () => {
      const mockFileHandle = {
        writeFile: vi.fn().mockResolvedValue(undefined),
        sync: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile
        .mockRejectedValueOnce({ code: 'ENOENT' })
        .mockResolvedValueOnce(JSON.stringify({
          lockId: 'different-lock',
          pid: process.pid,
          hostname: os.hostname(),
          acquiredAt: new Date().toISOString(),
        }));
      mockOpen.mockResolvedValue(mockFileHandle);

      const lock = new SessionLock(testSessionId);
      const result = await lock.tryAcquire();

      expect(result.acquired).toBe(false);
      expect(result.reason).toBe('error');
    });
  });

  describe('stale lock cleanup', () => {
    it('should break stale lock when process is dead', async () => {
      const staleLock = {
        lockId: 'stale-lock',
        pid: 99999,
        processStartTime: 1234567890,
        hostname: os.hostname(),
        acquiredAt: new Date(Date.now() - 70000).toISOString(),
      };

      const mockFileHandle = {
        writeFile: vi.fn().mockImplementation((content) => {
          mockReadFile.mockResolvedValue(content);
          return Promise.resolve(undefined);
        }),
        sync: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockResolvedValueOnce(JSON.stringify(staleLock));
      mockGetProcessStartTime.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);
      mockOpen.mockResolvedValue(mockFileHandle);

      const lock = new SessionLock(testSessionId);
      const result = await lock.tryAcquire();

      expect(result.acquired).toBe(true);
      expect(result.reason).toBe('stale_broken');
    });

    it('should not break fresh lock', async () => {
      const freshLock = {
        lockId: 'fresh-lock',
        pid: 99999,
        processStartTime: 1234567890,
        hostname: os.hostname(),
        acquiredAt: new Date(Date.now() - 30000).toISOString(),
      };

      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockResolvedValue(JSON.stringify(freshLock));
      mockGetProcessStartTime.mockResolvedValue(undefined);

      const lock = new SessionLock(testSessionId);
      const result = await lock.tryAcquire();

      expect(result.acquired).toBe(false);
      expect(result.reason).toBe('held_by_other');
    });

    it('should require longer timeout for remote locks', async () => {
      const remoteLock = {
        lockId: 'remote-lock',
        pid: 99999,
        processStartTime: 1234567890,
        hostname: 'remote-host',
        acquiredAt: new Date(Date.now() - 70000).toISOString(),
      };

      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockResolvedValue(JSON.stringify(remoteLock));

      const lock = new SessionLock(testSessionId);
      const result = await lock.tryAcquire();

      expect(result.acquired).toBe(false);
      expect(result.reason).toBe('held_by_other');
    });
  });

  describe('forceBreak', () => {
    it('should force break lock', async () => {
      mockUnlink.mockResolvedValue(undefined);

      const lock = new SessionLock(testSessionId);
      await lock.forceBreak();

      expect(mockUnlink).toHaveBeenCalledWith(testLockPath);
      expect(lock.isHeld()).toBe(false);
    });

    it('should ignore ENOENT when force breaking non-existent lock', async () => {
      mockUnlink.mockRejectedValue({ code: 'ENOENT' });

      const lock = new SessionLock(testSessionId);
      await expect(lock.forceBreak()).resolves.not.toThrow();
    });
  });

  describe('getLockStatus', () => {
    it('should return unlocked status when no lock exists', async () => {
      mockLstat.mockRejectedValue({ code: 'ENOENT' });
      mockReadFile.mockRejectedValue({ code: 'ENOENT' });

      const status = await getLockStatus(testSessionId);

      expect(status.locked).toBe(false);
      expect(status.lockInfo).toBeNull();
    });

    it('should return locked status with lock info', async () => {
      const lockInfo = {
        lockId: 'test-lock',
        pid: process.pid,
        processStartTime: 1234567890,
        hostname: os.hostname(),
        acquiredAt: new Date().toISOString(),
      };

      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockResolvedValue(JSON.stringify(lockInfo));
      mockGetProcessStartTime.mockResolvedValue(1234567890);

      const status = await getLockStatus(testSessionId);

      expect(status.locked).toBe(true);
      expect(status.ownedByUs).toBe(true);
    });
  });

  describe('isProcessAlive', () => {
    it('should return false for invalid PID', async () => {
      const result = await isProcessAlive(-1);
      expect(result).toBe(false);
    });

    it('should return true when process exists with matching start time', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

      mockGetProcessStartTime.mockResolvedValue(1234567890);
      const result = await isProcessAlive(12345, 1234567890);

      expect(result).toBe(true);

      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    });

    it('should return false when start time differs (PID reuse)', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

      mockGetProcessStartTime.mockResolvedValue(9999999999);
      const result = await isProcessAlive(12345, 1234567890);

      expect(result).toBe(false);

      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    });
  });
});

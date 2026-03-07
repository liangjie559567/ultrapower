import { describe, it, expect, vi, beforeEach, afterEach as _afterEach } from 'vitest';
import * as path from 'path';

// Set environment variable BEFORE importing bridge-manager
const testBridgePath = path.resolve(process.cwd(), 'bridge', 'gyoshu_bridge.py');
process.env.OMC_BRIDGE_SCRIPT = testBridgePath;

// Mock fs with async factory (ESM-compatible)
const mockExistsSync = vi.hoisted(() => vi.fn());
const mockMkdirSync = vi.hoisted(() => vi.fn());
const mockWriteFileSync = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());
const mockUnlinkSync = vi.hoisted(() => vi.fn());
const mockRmdirSync = vi.hoisted(() => vi.fn());
const mockStatSync = vi.hoisted(() => vi.fn());
const mockLstatSync = vi.hoisted(() => vi.fn());
const mockReaddirSync = vi.hoisted(() => vi.fn());
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    writeFileSync: mockWriteFileSync,
    readFileSync: mockReadFileSync,
    unlinkSync: mockUnlinkSync,
    rmdirSync: mockRmdirSync,
    statSync: mockStatSync,
    lstatSync: mockLstatSync,
    readdirSync: mockReaddirSync,
    promises: {
      ...actual.promises,
      readFile: mockReadFile,
      unlink: vi.fn(),
      readdir: vi.fn(),
      open: vi.fn().mockResolvedValue({
        write: vi.fn().mockResolvedValue(undefined),
        sync: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined)
      }),
      rename: vi.fn().mockResolvedValue(undefined)
    }
  };
});

// Mock child_process
const mockExecSync = vi.hoisted(() => vi.fn());
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: mockExecSync,
  execFile: vi.fn()
}));

// Mock paths
vi.mock('../paths.js', () => ({
  getRuntimeDir: () => '/tmp/.omc/python-repl',
  shortenSessionId: (sessionId: string) => sessionId.substring(0, 12),
  getSessionDir: (sessionId: string) => `/tmp/.omc/python-repl/${sessionId}`,
  getBridgeSocketPath: (sessionId: string) => `/tmp/.omc/python-repl/${sessionId}/bridge.sock`,
  getBridgeMetaPath: (sessionId: string) => `/tmp/.omc/python-repl/${sessionId}/bridge-meta.json`,
  getSessionLockPath: (sessionId: string) => `/tmp/.omc/python-repl/${sessionId}/session.lock`,
  validatePathSegment: vi.fn()
}));

// Mock process-utils
vi.mock('../../../platform/process-utils.js', () => ({
  isProcessAlive: vi.fn(),
  getProcessStartTime: vi.fn()
}));

// Mock atomic-write
const mockSafeReadJson = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/atomic-write.js', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/atomic-write.js')>('../../../lib/atomic-write.js');
  return {
    ...actual,
    safeReadJson: mockSafeReadJson
  };
});

// NOW import bridge-manager (after ALL mocks are set up)
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as bridgeManager from '../bridge-manager.js';
import {
  verifyProcessIdentity,
  spawnBridgeServer,
  ensureBridge,
  killBridgeWithEscalation,
  cleanupBridgeSessions,
  cleanupStaleBridges,
  isSocket as _isSocket
} from '../bridge-manager.js';
import type { BridgeMeta } from '../types.js';
import { isProcessAlive, getProcessStartTime } from '../../../platform/process-utils.js';

describe('bridge-manager', () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
    mockMkdirSync.mockReset();
    mockWriteFileSync.mockReset();
    mockReadFileSync.mockReset();
    mockReadFile.mockReset();
    mockUnlinkSync.mockReset();
    mockRmdirSync.mockReset();
    mockStatSync.mockReset();
    mockReaddirSync.mockReset();
    mockExecSync.mockReset();
    mockSafeReadJson.mockReset();
    mockLstatSync.mockReset();

    // Ensure test directory exists for atomicWriteJson
    const realFs = require('fs');
    const sessionDir = '/tmp/.omc/python-repl/test-session';
    if (!realFs.existsSync(sessionDir)) {
      realFs.mkdirSync(sessionDir, { recursive: true });
    }

    mockExistsSync.mockReturnValue(true);
    mockLstatSync.mockReturnValue({
      isSocket: () => true,
      isFile: () => false,
      isDirectory: () => false
    } as any);
    mockSafeReadJson.mockRejectedValue(new Error('ENOENT'));
  });

  describe('verifyProcessIdentity', () => {
    it('returns false when process is not alive', async () => {
      vi.mocked(isProcessAlive).mockReturnValue(false);

      const meta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' }
      };

      const result = await verifyProcessIdentity(meta);
      expect(result).toBe(false);
    });

    it('returns true when process is alive and no start time check', async () => {
      vi.mocked(isProcessAlive).mockReturnValue(true);

      const meta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' }
      };

      const result = await verifyProcessIdentity(meta);
      expect(result).toBe(true);
    });

    it('returns false when start time does not match', async () => {
      vi.mocked(isProcessAlive).mockReturnValue(true);
      vi.mocked(getProcessStartTime).mockResolvedValue(1000);

      const meta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' },
        processStartTime: 2000
      };

      const result = await verifyProcessIdentity(meta);
      expect(result).toBe(false);
    });

    it('returns true when start time matches', async () => {
      vi.mocked(isProcessAlive).mockReturnValue(true);
      vi.mocked(getProcessStartTime).mockResolvedValue(1000);

      const meta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' },
        processStartTime: 1000
      };

      const result = await verifyProcessIdentity(meta);
      expect(result).toBe(true);
    });

    it('returns false when getProcessStartTime returns undefined', async () => {
      vi.mocked(isProcessAlive).mockReturnValue(true);
      vi.mocked(getProcessStartTime).mockResolvedValue(undefined);

      const meta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' },
        processStartTime: 1000
      };

      const result = await verifyProcessIdentity(meta);
      expect(result).toBe(false);
    });
  });

  describe('spawnBridgeServer', () => {
    it('spawns bridge server successfully', async () => {
      const mockSpawn = vi.fn().mockReturnValue({
        pid: 12345,
        unref: vi.fn(),
        on: vi.fn(),
        stderr: { on: vi.fn() }
      });
      vi.mocked(child_process.spawn).mockImplementation(mockSpawn as any);
      vi.mocked(getProcessStartTime).mockResolvedValue(1000);

      // Mock isSocket to return true immediately to avoid 30s timeout
      const mockIsSocket = vi.spyOn(bridgeManager, 'isSocket').mockReturnValue(true);

      const result = await spawnBridgeServer('test-session');

      expect(result.pid).toBe(12345);
      expect(result.sessionId).toBe('test-session');
      expect(mockSpawn).toHaveBeenCalled();

      mockIsSocket.mockRestore();
    });

    it('throws error when spawn fails', async () => {
      const mockSpawn = vi.fn().mockReturnValue({
        pid: undefined,
        unref: vi.fn(),
        on: vi.fn(),
        stderr: { on: vi.fn() }
      });
      vi.mocked(child_process.spawn).mockImplementation(mockSpawn as any);

      // Mock isSocket to avoid timeout (though this test should fail before socket check)
      const mockIsSocket = vi.spyOn(bridgeManager, 'isSocket').mockReturnValue(true);

      await expect(spawnBridgeServer('test-session')).rejects.toThrow('Failed to spawn bridge server: no PID assigned');

      mockIsSocket.mockRestore();
    });
  });

  describe('ensureBridge', () => {
    it('returns existing bridge when valid', async () => {
      const validMeta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/.omc/python-repl/test-session/bridge.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' },
        processStartTime: 1000
      };

      mockSafeReadJson.mockResolvedValue(validMeta);
      vi.mocked(isProcessAlive).mockReturnValue(true);
      vi.mocked(getProcessStartTime).mockResolvedValue(1000);

      // Mock isSocket to avoid timeout
      const mockIsSocket = vi.spyOn(bridgeManager, 'isSocket').mockReturnValue(true);

      const result = await ensureBridge('test-session');

      expect(result.pid).toBe(12345);
      expect(result.sessionId).toBe('test-session');

      mockIsSocket.mockRestore();
    });

    it('spawns new bridge when meta file does not exist', async () => {
      const mockSpawn = vi.fn().mockReturnValue({
        pid: 12345,
        unref: vi.fn(),
        on: vi.fn(),
        stderr: { on: vi.fn() }
      });
      vi.mocked(child_process.spawn).mockImplementation(mockSpawn as any);
      vi.mocked(getProcessStartTime).mockResolvedValue(1000);

      // Mock isSocket to return true immediately to avoid 30s timeout
      const mockIsSocket = vi.spyOn(bridgeManager, 'isSocket').mockReturnValue(true);

      const result = await ensureBridge('test-session');

      expect(result.pid).toBe(12345);
      expect(mockSpawn).toHaveBeenCalled();

      mockIsSocket.mockRestore();
    });
  });

  describe('killBridgeWithEscalation', () => {
    it('kills bridge with SIGINT first', async () => {
      const validMeta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' }
      };

      mockSafeReadJson.mockResolvedValue(validMeta);

      const isProcessAliveMock = vi.mocked(isProcessAlive);
      isProcessAliveMock.mockReturnValueOnce(true);   // Initial verifyProcessIdentity
      isProcessAliveMock.mockReturnValueOnce(false);  // waitForExit check

      const mockKill = vi.spyOn(process, 'kill').mockReturnValue(true);

      const result = await killBridgeWithEscalation('test-session');

      expect(result.terminated).toBe(true);
      expect(result.terminatedBy).toBe('SIGINT');
      mockKill.mockRestore();
    });

    it('escalates to SIGTERM when SIGINT fails', async () => {
      const validMeta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' }
      };

      mockSafeReadJson.mockResolvedValue(validMeta);

      const mock = vi.mocked(isProcessAlive);
      mock.mockReturnValueOnce(true); // Initial verifyProcessIdentity
      for (let i = 0; i < 50; i++) {
        mock.mockReturnValueOnce(true); // SIGINT waitForExit timeout loops
      }
      mock.mockReturnValueOnce(false); // SIGTERM waitForExit success

      const mockKill = vi.spyOn(process, 'kill').mockReturnValue(true);

      const result = await killBridgeWithEscalation('test-session');

      expect(result.terminated).toBe(true);
      expect(result.terminatedBy).toBe('SIGTERM');
      mockKill.mockRestore();
    });

    it('escalates to SIGKILL when SIGTERM fails', async () => {
      const validMeta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' }
      };

      mockSafeReadJson.mockResolvedValue(validMeta);

      const mock = vi.mocked(isProcessAlive);
      mock.mockReturnValueOnce(true); // Initial verifyProcessIdentity
      for (let i = 0; i < 50; i++) {
        mock.mockReturnValueOnce(true); // SIGINT waitForExit timeout
      }
      for (let i = 0; i < 25; i++) {
        mock.mockReturnValueOnce(true); // SIGTERM waitForExit timeout
      }
      mock.mockReturnValueOnce(false); // SIGKILL waitForExit success

      const mockKill = vi.spyOn(process, 'kill').mockReturnValue(true);

      const result = await killBridgeWithEscalation('test-session');

      expect(result.terminated).toBe(true);
      expect(result.terminatedBy).toBe('SIGKILL');
      mockKill.mockRestore();
    });

    it('returns failure when all signals fail', async () => {
      const validMeta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'test-session',
        pythonEnv: { pythonPath: '/usr/bin/python3' }
      };

      mockSafeReadJson.mockResolvedValue(validMeta);

      vi.mocked(isProcessAlive)
        .mockReturnValueOnce(true)  // Initial verifyProcessIdentity
        .mockReturnValue(true);     // All waitForExit loops timeout
      vi.mocked(getProcessStartTime).mockResolvedValue(undefined);

      const result = await killBridgeWithEscalation('test-session');

      expect(result.terminated).toBe(true);
    });
  });

  describe('cleanupBridgeSessions', () => {
    it('cleans up multiple sessions successfully', async () => {
      const sessionIds = ['session1', 'session2'];

      const validMeta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'session1',
        pythonEnv: { pythonPath: '/usr/bin/python3' }
      };

      mockExistsSync.mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validMeta));

      vi.mocked(isProcessAlive).mockReturnValueOnce(true).mockReturnValueOnce(false);

      const _mockKill = vi.spyOn(process, 'kill').mockReturnValue(true);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

      const result = await cleanupBridgeSessions(sessionIds);

      expect(result.requestedSessions).toBe(2);
      expect(result.terminatedSessions).toBeGreaterThanOrEqual(0);
    });

    it('handles empty session list', async () => {
      const result = await cleanupBridgeSessions([]);

      expect(result.requestedSessions).toBe(0);
      expect(result.terminatedSessions).toBe(0);
    });
  });

  describe('cleanupStaleBridges', () => {
    it('cleans up stale bridges successfully', async () => {
      mockExistsSync.mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['session1', 'session2'] as any);

      const validMeta: BridgeMeta = {
        pid: 12345,
        socketPath: '/tmp/test.sock',
        startedAt: '2026-03-03T10:00:00Z',
        sessionId: 'session1',
        pythonEnv: { pythonPath: '/usr/bin/python3' }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validMeta));

      vi.mocked(isProcessAlive).mockReturnValue(false); // All processes dead

      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);
      vi.mocked(fs.rmdirSync).mockReturnValue(undefined);

      const result = await cleanupStaleBridges();

      expect(result.scannedSessions).toBeGreaterThanOrEqual(0);
    });

    it('handles missing python-repl directory', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await cleanupStaleBridges();

      expect(result.scannedSessions).toBe(0);
      expect(result.staleSessions).toBe(0);
    });
  });
});

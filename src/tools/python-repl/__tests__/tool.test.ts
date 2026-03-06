import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PythonReplInput, ExecuteResult, StateResult, ResetResult, InterruptResult } from '../types.js';

// Hoisted mocks
const mockValidatePathSegment = vi.hoisted(() => vi.fn());
const mockAcquire = vi.hoisted(() => vi.fn());
const mockRelease = vi.hoisted(() => vi.fn());
const mockSendSocketRequest = vi.hoisted(() => vi.fn());
const mockEnsureBridge = vi.hoisted(() => vi.fn());
const mockKillBridgeWithEscalation = vi.hoisted(() => vi.fn());
const mockSpawnBridgeServer = vi.hoisted(() => vi.fn());

// Mock dependencies
vi.mock('../paths.js', () => ({
  validatePathSegment: mockValidatePathSegment,
  getRuntimeDir: () => '/tmp/.omc/python-repl',
  getSessionDir: (sessionId: string) => `/tmp/.omc/python-repl/${sessionId}`,
  getBridgeSocketPath: (sessionId: string) => `/tmp/.omc/python-repl/${sessionId}/bridge.sock`
}));

vi.mock('../session-lock.js', () => {
  class MockSessionLock {
    acquire = mockAcquire;
    release = mockRelease;
  }

  class LockTimeoutError extends Error {
    constructor(public lockPath: string, public timeout: number, public lastHolder?: any) {
      super(`Lock timeout: ${timeout}ms`);
      this.name = 'LockTimeoutError';
    }
  }

  return {
    SessionLock: MockSessionLock,
    LockTimeoutError
  };
});

vi.mock('../socket-client.js', () => ({
  sendSocketRequest: mockSendSocketRequest,
  SocketConnectionError: class SocketConnectionError extends Error {
    constructor(message: string, public socketPath: string, public originalError?: Error) {
      super(message);
      this.name = 'SocketConnectionError';
    }
  },
  SocketTimeoutError: class SocketTimeoutError extends Error {
    constructor(message: string, public timeoutMs: number) {
      super(message);
      this.name = 'SocketTimeoutError';
    }
  },
  JsonRpcError: class JsonRpcError extends Error {
    constructor(message: string, public code: number, public data?: unknown) {
      super(message);
      this.name = 'JsonRpcError';
    }
  }
}));

vi.mock('../bridge-manager.js', () => ({
  ensureBridge: mockEnsureBridge,
  killBridgeWithEscalation: mockKillBridgeWithEscalation,
  spawnBridgeServer: mockSpawnBridgeServer
}));

import {
  pythonReplHandler,
  pythonReplSchema,
  getExecutionCount,
  resetExecutionCounter
} from '../tool.js';
import { LockTimeoutError } from '../session-lock.js';
import { SocketConnectionError, SocketTimeoutError } from '../socket-client.js';

describe('python-repl/tool', () => {
  const mockBridgeMeta = {
    pid: 12345,
    socketPath: '/tmp/.omc/python-repl/test-session/bridge.sock',
    startedAt: '2026-03-05T10:00:00.000Z',
    sessionId: 'test-session',
    pythonEnv: { pythonPath: '/path/to/python', type: 'venv' as const }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAcquire.mockResolvedValue(undefined);
    mockRelease.mockResolvedValue(undefined);
    mockEnsureBridge.mockResolvedValue(mockBridgeMeta);
    mockValidatePathSegment.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Schema validation', () => {
    it('validates valid execute input', () => {
      const input = {
        action: 'execute',
        researchSessionID: 'test-session',
        code: 'print("hello")'
      };
      const result = pythonReplSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects missing researchSessionID', () => {
      const input = { action: 'execute', code: 'print("hello")' };
      const result = pythonReplSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects invalid action', () => {
      const input = { action: 'invalid', researchSessionID: 'test' };
      const result = pythonReplSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('applies default timeouts', () => {
      const input = { action: 'execute', researchSessionID: 'test', code: 'x=1' };
      const result = pythonReplSchema.parse(input);
      expect(result.executionTimeout).toBe(300000);
      expect(result.queueTimeout).toBe(30000);
    });
  });

  describe('Execute action', () => {
    it('executes code successfully', async () => {
      const executeResult: ExecuteResult = {
        success: true,
        stdout: 'Hello, World!\n',
        stderr: '',
        markers: [],
        artifacts: [],
        timing: { started_at: '2026-03-05T10:00:00Z', duration_ms: 50 },
        memory: { rss_mb: 25.5, vms_mb: 100.2 }
      };
      mockSendSocketRequest.mockResolvedValue(executeResult);

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'test-session',
        code: 'print("Hello, World!")'
      };

      const output = await pythonReplHandler(input);

      expect(mockAcquire).toHaveBeenCalledWith(30000);
      expect(mockEnsureBridge).toHaveBeenCalledWith('test-session', undefined);
      expect(mockSendSocketRequest).toHaveBeenCalledWith(
        mockBridgeMeta.socketPath,
        'execute',
        { code: 'print("Hello, World!")', timeout: 300 },
        310000
      );
      expect(output).toContain('Hello, World!');
      expect(output).toContain('Execution Complete');
      expect(mockRelease).toHaveBeenCalled();
    });

    it('requires code parameter', async () => {
      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'test-session'
      };

      const output = await pythonReplHandler(input);

      expect(output).toContain('Missing Code');
      expect(output).toContain('requires the "code" parameter');
      expect(mockAcquire).not.toHaveBeenCalled();
    });

    it('handles execution with markers', async () => {
      const executeResult: ExecuteResult = {
        success: true,
        stdout: 'Analysis complete\n',
        stderr: '',
        markers: [
          { type: 'FINDING', subtype: 'correlation', content: 'Strong correlation found', line_number: 1, category: 'insights' }
        ],
        artifacts: [],
        timing: { started_at: '2026-03-05T10:00:00Z', duration_ms: 100 },
        memory: { rss_mb: 30.0, vms_mb: 120.0 }
      };
      mockSendSocketRequest.mockResolvedValue(executeResult);

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'test-session',
        code: 'analyze_data()',
        executionLabel: 'Data Analysis'
      };

      const output = await pythonReplHandler(input);

      expect(output).toContain('Label: Data Analysis');
      expect(output).toContain('[FINDING:correlation] Strong correlation found');
      expect(output).toContain('Duration: 0.100s');
    });

    it('handles execution timeout', async () => {
      mockSendSocketRequest.mockRejectedValue(new SocketTimeoutError('Timeout', 5000));

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'test-session',
        code: 'import time; time.sleep(100)',
        executionTimeout: 5000
      };

      const output = await pythonReplHandler(input);

      expect(output).toContain('Execution Timeout');
      expect(output).toContain('exceeded the timeout of 5 seconds');
      expect(output).toContain('Use the "interrupt" action to stop it');
    });

    it('retries on connection error', async () => {
      mockSendSocketRequest
        .mockRejectedValueOnce(new SocketConnectionError('Connection failed', '/test.sock'))
        .mockResolvedValueOnce({
          success: true,
          stdout: 'Retry success\n',
          stderr: '',
          markers: [],
          artifacts: [],
          timing: { started_at: '2026-03-05T10:00:00Z', duration_ms: 50 },
          memory: { rss_mb: 25.0, vms_mb: 100.0 }
        });
      mockSpawnBridgeServer.mockResolvedValue(mockBridgeMeta);

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'test-session',
        code: 'print("test")'
      };

      const output = await pythonReplHandler(input);

      expect(mockSpawnBridgeServer).toHaveBeenCalledWith('test-session', undefined);
      expect(output).toContain('Retry success');
    });
  });

  describe('Reset action', () => {
    it('resets namespace successfully', async () => {
      const resetResult: ResetResult = {
        status: 'reset',
        memory: { rss_mb: 20.0, vms_mb: 80.0 }
      };
      mockSendSocketRequest.mockResolvedValue(resetResult);

      const input: PythonReplInput = {
        action: 'reset',
        researchSessionID: 'test-session'
      };

      const output = await pythonReplHandler(input);

      expect(mockSendSocketRequest).toHaveBeenCalledWith(
        mockBridgeMeta.socketPath,
        'reset',
        {},
        10000
      );
      expect(output).toContain('Python REPL Reset');
      expect(output).toContain('Namespace Cleared');
      expect(getExecutionCount('test-session')).toBe(0);
    });

    it('kills bridge on reset failure', async () => {
      mockSendSocketRequest.mockRejectedValue(new Error('Reset failed'));
      mockKillBridgeWithEscalation.mockResolvedValue({
        terminatedBy: 'SIGTERM',
        terminationTimeMs: 100
      });

      const input: PythonReplInput = {
        action: 'reset',
        researchSessionID: 'test-session'
      };

      const output = await pythonReplHandler(input);

      expect(mockKillBridgeWithEscalation).toHaveBeenCalledWith('test-session');
      expect(output).toContain('Bridge Restarted');
      expect(output).toContain('bridge was unresponsive');
    });
  });

  describe('Get state action', () => {
    it('retrieves state successfully', async () => {
      const stateResult: StateResult = {
        memory: { rss_mb: 30.5, vms_mb: 120.0 },
        variables: ['x', 'y', 'data', 'result'],
        variable_count: 4
      };
      mockSendSocketRequest.mockResolvedValue(stateResult);

      const input: PythonReplInput = {
        action: 'get_state',
        researchSessionID: 'test-session'
      };

      const output = await pythonReplHandler(input);

      expect(mockSendSocketRequest).toHaveBeenCalledWith(
        mockBridgeMeta.socketPath,
        'get_state',
        {},
        5000
      );
      expect(output).toContain('Python REPL State');
      expect(output).toContain('Count: 4');
      expect(output).toContain('x, y, data, result');
    });

    it('handles empty variable list', async () => {
      const stateResult: StateResult = {
        memory: { rss_mb: 20.0, vms_mb: 80.0 },
        variables: [],
        variable_count: 0
      };
      mockSendSocketRequest.mockResolvedValue(stateResult);

      const input: PythonReplInput = {
        action: 'get_state',
        researchSessionID: 'test-session'
      };

      const output = await pythonReplHandler(input);

      expect(output).toContain('Count: 0');
      expect(output).toContain('(no user variables defined)');
    });
  });

  describe('Interrupt action', () => {
    it('interrupts gracefully', async () => {
      const interruptResult: InterruptResult = {
        status: 'interrupted'
      };
      mockSendSocketRequest.mockResolvedValue(interruptResult);

      const input: PythonReplInput = {
        action: 'interrupt',
        researchSessionID: 'test-session'
      };

      const output = await pythonReplHandler(input);

      expect(mockSendSocketRequest).toHaveBeenCalledWith(
        mockBridgeMeta.socketPath,
        'interrupt',
        {},
        5000
      );
      expect(output).toContain('Python REPL Interrupt');
      expect(output).toContain('Execution Interrupted');
      expect(getExecutionCount('test-session')).toBe(0);
    });

    it('escalates to force kill on graceful failure', async () => {
      mockSendSocketRequest.mockRejectedValue(new Error('Interrupt failed'));
      mockKillBridgeWithEscalation.mockResolvedValue({
        terminatedBy: 'SIGKILL',
        terminationTimeMs: 200
      });

      const input: PythonReplInput = {
        action: 'interrupt',
        researchSessionID: 'test-session'
      };

      const output = await pythonReplHandler(input);

      expect(mockKillBridgeWithEscalation).toHaveBeenCalledWith('test-session', { gracePeriodMs: 5000 });
      expect(output).toContain('Status: force_killed');
      expect(output).toContain('Terminated By: SIGKILL');
    });
  });

  describe('Session lock handling', () => {
    it('handles lock timeout', async () => {
      const lockError = new LockTimeoutError('/path/to/lock', 30000, {
        lockId: 'lock-123',
        pid: 9999,
        hostname: 'test-host',
        acquiredAt: '2026-03-05T09:00:00Z'
      });
      mockAcquire.mockRejectedValue(lockError);

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'test-session',
        code: 'print("test")'
      };

      const output = await pythonReplHandler(input);

      expect(output).toContain('Session Busy');
      expect(output).toContain('PID: 9999');
      expect(output).toContain('Host: test-host');
      expect(output).toContain('Use the "interrupt" action');
    });

    it('always releases lock', async () => {
      mockSendSocketRequest.mockRejectedValue(new Error('Execution failed'));

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'test-session',
        code: 'raise Exception("test")'
      };

      await pythonReplHandler(input);

      expect(mockRelease).toHaveBeenCalled();
    });
  });

  describe('Path validation', () => {
    it('rejects invalid session ID', async () => {
      mockValidatePathSegment.mockImplementation(() => {
        throw new Error('Invalid path segment');
      });

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: '../../../etc/passwd',
        code: 'print("test")'
      };

      const output = await pythonReplHandler(input);

      expect(output).toContain('Invalid Session ID');
      expect(output).toContain('Path separators');
      expect(mockAcquire).not.toHaveBeenCalled();
    });
  });

  describe('Bridge startup failure', () => {
    it('handles bridge startup error', async () => {
      mockEnsureBridge.mockRejectedValue(new Error('Python not found'));

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'test-session',
        code: 'print("test")'
      };

      const output = await pythonReplHandler(input);

      expect(output).toContain('Bridge Startup Failed');
      expect(output).toContain('Python not found');
      expect(output).toContain('python -m venv .venv');
    });
  });

  describe('Execution counter', () => {
    it('increments execution count', async () => {
      const executeResult: ExecuteResult = {
        success: true,
        stdout: 'test\n',
        stderr: '',
        markers: [],
        artifacts: [],
        timing: { started_at: '2026-03-05T10:00:00Z', duration_ms: 10 },
        memory: { rss_mb: 20.0, vms_mb: 80.0 }
      };
      mockSendSocketRequest.mockResolvedValue(executeResult);

      const input: PythonReplInput = {
        action: 'execute',
        researchSessionID: 'counter-test',
        code: 'x=1'
      };

      await pythonReplHandler(input);
      expect(getExecutionCount('counter-test')).toBe(1);

      await pythonReplHandler(input);
      expect(getExecutionCount('counter-test')).toBe(2);

      resetExecutionCounter('counter-test');
      expect(getExecutionCount('counter-test')).toBe(0);
    });
  });
});

/**
 * Tests for T-1i: LSP client timer leak + buffer cap
 *
 * Covers:
 * 1. disconnect() clears pending timeouts (no timer leak)
 * 2. disconnect() rejects pending promises with 'LSP client disconnected'
 * 3. handleData() disconnects when buffer exceeds 64MB
 * 4. handleData() normal data does not trigger disconnect (no regression)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---- Mock child_process so LspClient can be instantiated without a real server ----
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('../servers.js', () => ({
  getServerForFile: vi.fn(),
  commandExists: vi.fn(() => true),
}));

import { spawn } from 'child_process';
import { LspClient } from '../client.js';

const mockSpawn = vi.mocked(spawn);

/** Build a mock ChildProcess whose stdout/stderr/stdin can be driven by tests. */
function buildMockProcess() {
  const stdoutListeners: Record<string, (data: Buffer) => void> = {};
  const stderrListeners: Record<string, (data: Buffer) => void> = {};
  const procListeners: Record<string, (...args: unknown[]) => void> = {};

  const proc = {
    stdin: { write: vi.fn() },
    stdout: {
      on: vi.fn((event: string, cb: (data: Buffer) => void) => {
        stdoutListeners[event] = cb;
      }),
    },
    stderr: {
      on: vi.fn((event: string, cb: (data: Buffer) => void) => {
        stderrListeners[event] = cb;
      }),
    },
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      procListeners[event] = cb;
    }),
    kill: vi.fn(),
    pid: 99999,
    _emit: (event: string, data: Buffer) => {
      stdoutListeners[event]?.(data);
    },
  };

  return proc;
}

/** Encode a JSON-RPC response as a proper LSP framed message. */
function frameMessage(obj: unknown): Buffer {
  const json = JSON.stringify(obj);
  const msg = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
  return Buffer.from(msg);
}

const FAKE_SERVER_CONFIG = {
  name: 'test-lsp',
  command: 'test-lsp',
  args: [] as string[],
  extensions: ['.ts'],
  installHint: 'npm install test-lsp',
};

describe('LspClient – T-1i: timer leak + buffer cap', () => {
  let mockProc: ReturnType<typeof buildMockProcess>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockProc = buildMockProcess();
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ---- Helper: create a connected client (initialize handshake is answered) ----
  async function makeConnectedClient(): Promise<LspClient> {
    const client = new LspClient('/workspace', FAKE_SERVER_CONFIG);

    const connectPromise = client.connect();

    // Answer the `initialize` request so connect() resolves
    await Promise.resolve(); // let the Promise chain tick
    const initResponse = frameMessage({ jsonrpc: '2.0', id: 1, result: { capabilities: {} } });
    mockProc._emit('data', initResponse);

    await connectPromise;
    return client;
  }

  // --------------------------------------------------------------------------
  // Scenario 1: disconnect() clears timers – no leak
  // --------------------------------------------------------------------------
  describe('disconnect() clears pending timeouts', () => {
    it('calls clearTimeout for each pending request before clearing the map', async () => {
      const client = await makeConnectedClient();

      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      // Issue two requests that will never receive a response (long timeout)
      const p1 = client['request']('textDocument/hover', {}, 30_000).catch(() => {});
      const p2 = client['request']('textDocument/definition', {}, 30_000).catch(() => {});

      // Two entries should now be pending (ids 2 and 3; id 1 was initialize)
      expect(client['pendingRequests'].size).toBe(2);

      // Answer the shutdown request so disconnect() can proceed
      const shutdownResponse = frameMessage({ jsonrpc: '2.0', id: 4, result: null });
      // Trigger disconnect – it will send a shutdown request
      const disconnectPromise = client.disconnect();
      await Promise.resolve();
      mockProc._emit('data', shutdownResponse);
      await disconnectPromise;

      // clearTimeout should have been called at least twice (once per pending request)
      const pendingClearCalls = clearTimeoutSpy.mock.calls.length;
      expect(pendingClearCalls).toBeGreaterThanOrEqual(2);

      // Map should be empty after disconnect
      expect(client['pendingRequests'].size).toBe(0);

      await p1;
      await p2;
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 2: disconnect() rejects pending promises with clear message
  // --------------------------------------------------------------------------
  describe('disconnect() rejects pending promises immediately', () => {
    it('pending promise is rejected with "LSP client disconnected"', async () => {
      const client = await makeConnectedClient();

      // Issue a request that will never receive a response
      const requestPromise = client['request']('textDocument/hover', {}, 30_000);

      // Answer the shutdown request so disconnect() proceeds
      const disconnectPromise = client.disconnect();
      await Promise.resolve();
      const shutdownResponse = frameMessage({ jsonrpc: '2.0', id: 3, result: null });
      mockProc._emit('data', shutdownResponse);
      await disconnectPromise;

      // The original request promise should be rejected with a clear message
      await expect(requestPromise).rejects.toThrow('LSP client disconnected');
    });

    it('pending promise rejects before the original timeout fires', async () => {
      const client = await makeConnectedClient();

      const requestPromise = client['request']('textDocument/hover', {}, 30_000);

      // Disconnect immediately (don't advance timers)
      const disconnectPromise = client.disconnect();
      await Promise.resolve();
      const shutdownResponse = frameMessage({ jsonrpc: '2.0', id: 3, result: null });
      mockProc._emit('data', shutdownResponse);
      await disconnectPromise;

      // Should reject with disconnect message, not timeout message
      await expect(requestPromise).rejects.toThrow('LSP client disconnected');

      // Advance well past the 30s timeout – no additional rejections should fire
      vi.advanceTimersByTime(60_000);
      // (no assertion needed here – the test would surface unhandled rejections if broken)
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: handleData() buffer > 64MB triggers disconnect + warning
  // --------------------------------------------------------------------------
  describe('handleData() buffer cap', () => {
    it('calls console.error and disconnect when buffer exceeds 64MB', async () => {
      const client = await makeConnectedClient();

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const disconnectSpy = vi.spyOn(client, 'disconnect').mockResolvedValue();

      const MAX = 64 * 1024 * 1024;

      // Pre-fill buffer to just below the limit
      (client as unknown as { buffer: string }).buffer = 'x'.repeat(MAX - 5);

      // Push 10 more bytes – total exceeds 64MB
      client['handleData']('y'.repeat(10));

      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/64|buffer exceeded|超过/i));
      expect(disconnectSpy).toHaveBeenCalledOnce();

      errorSpy.mockRestore();
    });

    it('does not append to buffer when limit is exceeded', async () => {
      const client = await makeConnectedClient();

      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(client, 'disconnect').mockResolvedValue();

      const MAX = 64 * 1024 * 1024;
      const initialFill = 'x'.repeat(MAX - 5);
      (client as unknown as { buffer: string }).buffer = initialFill;

      client['handleData']('y'.repeat(10));

      // Buffer should remain at the pre-filled size, not grown
      expect((client as unknown as { buffer: string }).buffer.length).toBe(MAX - 5);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: handleData() normal data does NOT trigger disconnect
  // --------------------------------------------------------------------------
  describe('handleData() normal data – no regression', () => {
    it('does not call disconnect for small valid data', async () => {
      const client = await makeConnectedClient();

      const disconnectSpy = vi.spyOn(client, 'disconnect');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Send a valid small JSON-RPC notification
      const notification = frameMessage({
        jsonrpc: '2.0',
        method: 'textDocument/publishDiagnostics',
        params: { uri: 'file:///test.ts', diagnostics: [] },
      });

      client['handleData'](notification.toString());

      expect(disconnectSpy).not.toHaveBeenCalled();
      // console.error may be called for unrelated LSP stderr; check the buffer warning isn't present
      const bufferWarningCalled = errorSpy.mock.calls.some((args) =>
        String(args[0]).match(/64|buffer exceeded|超过/)
      );
      expect(bufferWarningCalled).toBe(false);

      errorSpy.mockRestore();
    });

    it('data well below 64MB is appended normally', async () => {
      const client = await makeConnectedClient();
      vi.spyOn(client, 'disconnect').mockResolvedValue();

      const smallData = 'a'.repeat(1024); // 1 KB
      client['handleData'](smallData);

      // Buffer should contain the small data
      expect((client as unknown as { buffer: string }).buffer).toContain(smallData);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Idempotent disconnect (second call is a no-op)
  // --------------------------------------------------------------------------
  describe('disconnect() idempotency', () => {
    it('second disconnect call does not throw', async () => {
      const client = await makeConnectedClient();

      // First disconnect
      const firstDisconnect = client.disconnect();
      await Promise.resolve();
      const shutdownResponse = frameMessage({ jsonrpc: '2.0', id: 2, result: null });
      mockProc._emit('data', shutdownResponse);
      await firstDisconnect;

      // Second disconnect should return immediately (process is null)
      await expect(client.disconnect()).resolves.toBeUndefined();
    });
  });
});

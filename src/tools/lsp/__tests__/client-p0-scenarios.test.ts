import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock dependencies
vi.mock('child_process');
vi.mock('../servers.js', () => ({
  getServerForFile: vi.fn(),
  commandExists: vi.fn(() => true),
}));

import { LspClient } from '../client.js';

const mockSpawn = vi.mocked(spawn);

describe('LspClient P0 Scenarios', () => {
  let mockProcess: any;
  let stdoutEmitter: EventEmitter;
  let stderrEmitter: EventEmitter;
  let processEmitter: EventEmitter;

  beforeEach(() => {
    vi.useFakeTimers();

    stdoutEmitter = new EventEmitter();
    stderrEmitter = new EventEmitter();
    processEmitter = new EventEmitter();

    mockProcess = Object.assign(processEmitter, {
      stdin: { write: vi.fn() },
      stdout: stdoutEmitter,
      stderr: stderrEmitter,
      kill: vi.fn(),
      pid: 12345,
    });

    mockSpawn.mockReturnValue(mockProcess as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('P0-1: Server crash recovery', () => {
    it('should clear all state when server exits', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      const initResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { capabilities: {} },
      };
      const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(initMessage));

      await connectPromise;

      // Verify initialized
      expect((client as any).initialized).toBe(true);
      expect((client as any).process).not.toBeNull();

      // Server exits
      processEmitter.emit('exit', 0);

      // State should be cleared
      expect((client as any).process).toBeNull();
      expect((client as any).initialized).toBe(false);
    });

    it('should log error when server exits with non-zero code', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      const initResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { capabilities: {} },
      };
      const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(initMessage));

      await connectPromise;

      // Server exits with error code
      processEmitter.emit('exit', 137);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('LSP server exited with code 137')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('P0-2: Message buffer overflow', () => {
    it('should disconnect when buffer exceeds 64MB limit', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      const initResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { capabilities: {} },
      };
      const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(initMessage));

      await connectPromise;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Send data that exceeds 64MB
      const largeChunk = 'x'.repeat(65 * 1024 * 1024);
      stdoutEmitter.emit('data', Buffer.from(largeChunk));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('LSP 缓冲区超过')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('64MB')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not disconnect when buffer is under 64MB limit', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      const initResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { capabilities: {} },
      };
      const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(initMessage));

      await connectPromise;

      // Send data under limit
      const chunk = 'x'.repeat(1024 * 1024); // 1MB
      stdoutEmitter.emit('data', Buffer.from(chunk));

      expect((client as any).process).not.toBeNull();
    });
  });

  describe('P0-3: Concurrent request timeout', () => {
    it('should timeout multiple requests independently', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      const initResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { capabilities: {} },
      };
      const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(initMessage));

      await connectPromise;

      // Make three concurrent requests
      const req1 = (client as any).request('method1', {}, 1000);
      const req2 = (client as any).request('method2', {}, 2000);
      const req3 = (client as any).request('method3', {}, 3000);

      // Advance time to timeout first request
      vi.advanceTimersByTime(1100);
      await expect(req1).rejects.toThrow("timed out after 1000ms");

      // Other requests should still be pending
      expect((client as any).pendingRequests.size).toBe(2);

      // Advance to timeout second request
      vi.advanceTimersByTime(1000);
      await expect(req2).rejects.toThrow("timed out after 2000ms");

      expect((client as any).pendingRequests.size).toBe(1);

      // Advance to timeout third request
      vi.advanceTimersByTime(1000);
      await expect(req3).rejects.toThrow("timed out after 3000ms");

      expect((client as any).pendingRequests.size).toBe(0);
    });

    it('should clean up timeout handles when requests complete', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      const initResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { capabilities: {} },
      };
      const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(initMessage));

      await connectPromise;

      // Make request
      const reqPromise = (client as any).request('test', {}, 5000);

      expect((client as any).pendingRequests.size).toBe(1);

      // Respond before timeout
      const response = {
        jsonrpc: '2.0',
        id: 2,
        result: { success: true },
      };
      const responseMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(response))}\r\n\r\n${JSON.stringify(response)}`;
      stdoutEmitter.emit('data', Buffer.from(responseMessage));

      await reqPromise;

      // Pending request should be cleared
      expect((client as any).pendingRequests.size).toBe(0);
    });
  });

  describe('P0-4: Initialize failure', () => {
    it('should reject connect when initialize fails', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      // Simulate initialize error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Invalid request',
        },
      };
      const errorMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(errorResponse))}\r\n\r\n${JSON.stringify(errorResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(errorMessage));

      await expect(connectPromise).rejects.toThrow('Invalid request');
    });

    it('should not set initialized flag when initialize fails', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      const errorResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Server initialization failed',
        },
      };
      const errorMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(errorResponse))}\r\n\r\n${JSON.stringify(errorResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(errorMessage));

      await expect(connectPromise).rejects.toThrow();
      expect((client as any).initialized).toBe(false);
    });

    it('should reject when initialize times out', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      // Don't send response, let it timeout
      vi.advanceTimersByTime(16000);

      await expect(connectPromise).rejects.toThrow('timed out');
      expect((client as any).initialized).toBe(false);
    });
  });
});

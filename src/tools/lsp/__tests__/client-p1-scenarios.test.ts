import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { existsSync, readFileSync } from 'fs';

vi.mock('child_process');
vi.mock('fs');
vi.mock('../servers.js', () => ({
  getServerForFile: vi.fn(),
  commandExists: vi.fn(() => true),
}));

import { LspClient } from '../client.js';

const mockSpawn = vi.mocked(spawn);
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('LspClient P1 Scenarios', () => {
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
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('const x = 1;');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('P1-5: Document sync boundaries', () => {
    it('should handle close on non-open document gracefully', async () => {
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

      // Close without opening - should not throw
      expect(() => client.closeDocument('/test/file.ts')).not.toThrow();
    });
  });

  describe('P1-8: Error handling', () => {
    it('should throw when opening non-existent file', async () => {
      mockExistsSync.mockReturnValue(false);

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

      await expect(client.openDocument('/nonexistent.ts')).rejects.toThrow('File not found');
    });

    it('should handle malformed JSON in messages gracefully', async () => {
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

      // Send malformed JSON
      const malformedMessage = `Content-Length: 20\r\n\r\n{invalid json here}`;

      // Should not throw
      expect(() => {
        stdoutEmitter.emit('data', Buffer.from(malformedMessage));
      }).not.toThrow();
    });

    it('should handle missing Content-Length header', async () => {
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

      // Send message without Content-Length
      const noHeaderMessage = `\r\n\r\n{"jsonrpc":"2.0","id":2,"result":{}}`;

      expect(() => {
        stdoutEmitter.emit('data', Buffer.from(noHeaderMessage));
      }).not.toThrow();
    });

    it('should handle response with error field', async () => {
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

      // Make a request
      const reqPromise = (client as any).request('test/method', {}, 5000);

      // Send error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: 2,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      };
      const errorMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(errorResponse))}\r\n\r\n${JSON.stringify(errorResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(errorMessage));

      await expect(reqPromise).rejects.toThrow('Method not found');
    });

    it('should handle notification messages', async () => {
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

      // Send diagnostic notification
      const notification = {
        jsonrpc: '2.0',
        method: 'textDocument/publishDiagnostics',
        params: {
          uri: 'file:///test/file.ts',
          diagnostics: [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 5 },
              },
              severity: 1,
              message: 'Test error',
            },
          ],
        },
      };
      const notifMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(notification))}\r\n\r\n${JSON.stringify(notification)}`;

      expect(() => {
        stdoutEmitter.emit('data', Buffer.from(notifMessage));
      }).not.toThrow();

      // Verify diagnostics were stored
      expect((client as any).diagnostics.has('file:///test/file.ts')).toBe(true);
    });
  });

  describe('P1-9: Buffer management', () => {
    it('should compact buffer after processing messages', async () => {
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

      // Send large message to trigger compaction
      const largeData = 'x'.repeat(9000);
      const largeResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: { data: largeData },
      };
      const largeMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(largeResponse))}\r\n\r\n${JSON.stringify(largeResponse)}`;

      stdoutEmitter.emit('data', Buffer.from(largeMessage));

      // Buffer should be compacted (offset reset)
      expect((client as any).bufferOffset).toBe(0);
    });
  });
});

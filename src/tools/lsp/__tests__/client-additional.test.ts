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
import { commandExists } from '../servers.js';

const mockSpawn = vi.mocked(spawn);
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockCommandExists = vi.mocked(commandExists);

describe('LspClient Additional Coverage', () => {
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
    mockCommandExists.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Connection management', () => {
    it('should not reconnect if already connected', async () => {
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

      const spawnCallCount = mockSpawn.mock.calls.length;

      // Try to connect again
      await client.connect();

      // Should not spawn again
      expect(mockSpawn.mock.calls.length).toBe(spawnCallCount);
    });

    it('should throw error when server command not found', async () => {
      mockCommandExists.mockReturnValue(false);

      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'nonexistent-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      await expect(client.connect()).rejects.toThrow('not found');
      await expect(client.connect()).rejects.toThrow('npm install test-lsp');
    });

    it('should handle spawn error', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      // Emit error before initialization
      processEmitter.emit('error', new Error('ENOENT'));

      await expect(connectPromise).rejects.toThrow('Failed to start LSP server');
    });

    it('should handle disconnect when not connected', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      // Should not throw
      await expect(client.disconnect()).resolves.toBeUndefined();
    });

    it('should log stderr output', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      // Emit stderr
      stderrEmitter.emit('data', Buffer.from('Warning: something happened'));

      const initResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { capabilities: {} },
      };
      const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
      stdoutEmitter.emit('data', Buffer.from(initMessage));

      await connectPromise;

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('LSP stderr')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Request handling', () => {
    it('should throw when making request without connection', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      await expect((client as any).request('test', {})).rejects.toThrow('not connected');
    });

    it('should increment request ID for each request', async () => {
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

      const writeSpy = vi.spyOn(mockProcess.stdin, 'write');

      (client as any).request('method1', {}).catch(() => {});
      (client as any).request('method2', {}).catch(() => {});

      const calls = writeSpy.mock.calls;
      const call1 = calls[calls.length - 2][0].toString();
      const call2 = calls[calls.length - 1][0].toString();

      expect(call1).toContain('"id":2');
      expect(call2).toContain('"id":3');
    });

    it('should handle response for unknown request ID', async () => {
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

      // Send response for non-existent request
      const unknownResponse = {
        jsonrpc: '2.0',
        id: 999,
        result: { data: 'test' },
      };
      const unknownMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(unknownResponse))}\r\n\r\n${JSON.stringify(unknownResponse)}`;

      // Should not throw
      expect(() => {
        stdoutEmitter.emit('data', Buffer.from(unknownMessage));
      }).not.toThrow();
    });
  });

  describe('Notification handling', () => {
    it('should ignore notifications without method', async () => {
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

      const invalidNotif = {
        jsonrpc: '2.0',
      };
      const invalidMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(invalidNotif))}\r\n\r\n${JSON.stringify(invalidNotif)}`;

      expect(() => {
        stdoutEmitter.emit('data', Buffer.from(invalidMessage));
      }).not.toThrow();
    });

    it('should handle unknown notification methods', async () => {
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

      const unknownNotif = {
        jsonrpc: '2.0',
        method: 'unknown/method',
        params: {},
      };
      const unknownMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(unknownNotif))}\r\n\r\n${JSON.stringify(unknownNotif)}`;

      expect(() => {
        stdoutEmitter.emit('data', Buffer.from(unknownMessage));
      }).not.toThrow();
    });
  });

  describe('Message parsing', () => {
    it('should handle partial messages across multiple data chunks', async () => {
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
      const fullMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;

      // Send in parts
      const part1 = fullMessage.slice(0, 20);
      const part2 = fullMessage.slice(20);

      stdoutEmitter.emit('data', Buffer.from(part1));
      stdoutEmitter.emit('data', Buffer.from(part2));

      await connectPromise;

      expect((client as any).initialized).toBe(true);
    });

    it('should handle multiple complete messages in one chunk', async () => {
      const client = new LspClient('/test/workspace', {
        name: 'test-lsp',
        command: 'test-lsp',
        args: [],
        extensions: ['.ts'],
        installHint: 'npm install test-lsp',
      });

      const connectPromise = client.connect();

      const msg1 = { jsonrpc: '2.0', id: 1, result: { capabilities: {} } };
      const msg2 = { jsonrpc: '2.0', id: 2, result: { data: 'test' } };

      const message1 = `Content-Length: ${Buffer.byteLength(JSON.stringify(msg1))}\r\n\r\n${JSON.stringify(msg1)}`;
      const message2 = `Content-Length: ${Buffer.byteLength(JSON.stringify(msg2))}\r\n\r\n${JSON.stringify(msg2)}`;

      // Send both messages at once
      stdoutEmitter.emit('data', Buffer.from(message1 + message2));

      await connectPromise;

      expect((client as any).initialized).toBe(true);
    });
  });
});

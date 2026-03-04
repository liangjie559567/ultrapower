import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'net';
import {
  sendSocketRequest,
  SocketConnectionError,
  SocketTimeoutError,
  JsonRpcError
} from '../socket-client.js';

vi.mock('net');
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-123'
}));

describe('socket-client', () => {
  let mockSocket: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = {
      write: vi.fn(),
      destroy: vi.fn(),
      removeAllListeners: vi.fn(),
      on: vi.fn()
    };
    vi.mocked(net.createConnection).mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error classes', () => {
    it('creates SocketConnectionError with properties', () => {
      const originalError = new Error('original');
      const error = new SocketConnectionError('test message', '/path/to/socket', originalError);

      expect(error.name).toBe('SocketConnectionError');
      expect(error.message).toBe('test message');
      expect(error.socketPath).toBe('/path/to/socket');
      expect(error.originalError).toBe(originalError);
    });

    it('creates SocketTimeoutError with timeout', () => {
      const error = new SocketTimeoutError('timeout message', 5000);

      expect(error.name).toBe('SocketTimeoutError');
      expect(error.message).toBe('timeout message');
      expect(error.timeoutMs).toBe(5000);
    });

    it('creates JsonRpcError with code and data', () => {
      const error = new JsonRpcError('rpc error', -32600, { detail: 'invalid' });

      expect(error.name).toBe('JsonRpcError');
      expect(error.message).toBe('rpc error');
      expect(error.code).toBe(-32600);
      expect(error.data).toEqual({ detail: 'invalid' });
    });
  });

  describe('sendSocketRequest', () => {
    it('sends request and returns result on success', async () => {
      const promise = sendSocketRequest<string>('/test.sock', 'testMethod', { arg: 'value' });

      const connectHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
      connectHandler();

      expect(mockSocket.write).toHaveBeenCalledWith(
        '{"jsonrpc":"2.0","id":"test-uuid-123","method":"testMethod","params":{"arg":"value"}}\n'
      );

      const dataHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'data')[1];
      dataHandler(Buffer.from('{"jsonrpc":"2.0","id":"test-uuid-123","result":"success"}\n'));

      const result = await promise;
      expect(result).toBe('success');
      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it('handles timeout', async () => {
      vi.useFakeTimers();
      const promise = sendSocketRequest('/test.sock', 'testMethod', {}, 1000);

      vi.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow(SocketTimeoutError);
      await expect(promise).rejects.toThrow('Request timeout after 1000ms for method "testMethod"');

      vi.useRealTimers();
    });

    it('handles ENOENT connection error', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const errorHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'error')[1];
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      errorHandler(error);

      await expect(promise).rejects.toThrow(SocketConnectionError);
      await expect(promise).rejects.toThrow('Socket does not exist at path: /test.sock');
    });

    it('handles ECONNREFUSED connection error', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const errorHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'error')[1];
      const error: any = new Error('ECONNREFUSED');
      error.code = 'ECONNREFUSED';
      errorHandler(error);

      await expect(promise).rejects.toThrow(SocketConnectionError);
      await expect(promise).rejects.toThrow('Connection refused - server not listening at: /test.sock');
    });

    it('handles generic connection error', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const errorHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'error')[1];
      errorHandler(new Error('generic error'));

      await expect(promise).rejects.toThrow(SocketConnectionError);
      await expect(promise).rejects.toThrow('Socket connection error: generic error');
    });

    it('rejects on invalid JSON-RPC version', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const connectHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
      connectHandler();

      const dataHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'data')[1];
      dataHandler(Buffer.from('{"jsonrpc":"1.0","id":"test-uuid-123","result":"success"}\n'));

      await expect(promise).rejects.toThrow('Invalid JSON-RPC version: expected "2.0", got "1.0"');
    });

    it('rejects on response ID mismatch', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const connectHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
      connectHandler();

      const dataHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'data')[1];
      dataHandler(Buffer.from('{"jsonrpc":"2.0","id":"wrong-id","result":"success"}\n'));

      await expect(promise).rejects.toThrow('Response ID mismatch: expected "test-uuid-123", got "wrong-id"');
    });

    it('handles JSON-RPC error response', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const connectHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
      connectHandler();

      const dataHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'data')[1];
      dataHandler(Buffer.from('{"jsonrpc":"2.0","id":"test-uuid-123","error":{"code":-32600,"message":"Invalid Request","data":{"detail":"bad"}}}\n'));

      await expect(promise).rejects.toThrow(JsonRpcError);
      await expect(promise).rejects.toThrow('Invalid Request');
    });

    it('rejects on JSON parse error', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const connectHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
      connectHandler();

      const dataHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'data')[1];
      dataHandler(Buffer.from('invalid json\n'));

      await expect(promise).rejects.toThrow('Failed to parse JSON-RPC response');
    });

    it('rejects on buffer overflow', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const connectHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
      connectHandler();

      const dataHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'data')[1];
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
      dataHandler(largeBuffer);

      await expect(promise).rejects.toThrow('Response exceeded maximum size of 2097152 bytes');
    });

    it('rejects on socket close without complete response', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const connectHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
      connectHandler();

      const dataHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'data')[1];
      dataHandler(Buffer.from('{"jsonrpc":"2.0"')); // incomplete

      const closeHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'close')[1];
      closeHandler();

      await expect(promise).rejects.toThrow('Socket closed without sending complete response (method: "testMethod")');
    });

    it('uses default empty params when not provided', async () => {
      const promise = sendSocketRequest('/test.sock', 'testMethod');

      const connectHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect')[1];
      connectHandler();

      expect(mockSocket.write).toHaveBeenCalledWith(
        '{"jsonrpc":"2.0","id":"test-uuid-123","method":"testMethod","params":{}}\n'
      );

      const dataHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'data')[1];
      dataHandler(Buffer.from('{"jsonrpc":"2.0","id":"test-uuid-123","result":"ok"}\n'));

      await promise;
    });
  });
});

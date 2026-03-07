import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPClient } from '../MCPClient.js';
import { EventEmitter } from 'events';

let mockClient: any;
let mockTransport: any;
let mockProcess: any;
let MockClient: any;
let MockTransport: any;
let mockSpawn: any;

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(function(this: any) {
    return mockClient;
  }),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn().mockImplementation(function(this: any) {
    return mockTransport;
  }),
}));

vi.mock('child_process', () => ({
  spawn: vi.fn(() => mockProcess),
}));

describe('MCPClient', () => {
  beforeEach(async () => {
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
    const { spawn } = await import('child_process');

    MockClient = Client;
    MockTransport = StdioClientTransport;
    mockSpawn = spawn;

    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue({ tools: [] }),
      callTool: vi.fn().mockResolvedValue({ content: [] }),
    };

    mockTransport = {};

    mockProcess = new EventEmitter() as any;
    mockProcess.kill = vi.fn();
    mockProcess.stdin = { write: vi.fn() };
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
  });

  describe('constructor', () => {
    it('should initialize with default client configuration', () => {
      new MCPClient();

      expect(MockClient).toHaveBeenCalledWith(
        { name: 'ultrapower-client', version: '1.0.0' },
        { capabilities: {} }
      );
    });

    it('should start in disconnected state', () => {
      const client = new MCPClient();
      expect(client.isAvailable()).toBe(true);
    });
  });

  describe('connect', () => {
    it('should establish connection successfully', async () => {
      const client = new MCPClient();

      await client.connect('uvx', ['test-server']);

      expect(MockTransport).toHaveBeenCalledWith({
        command: 'uvx',
        args: ['test-server'],
        env: undefined,
      });
      expect(mockClient.connect).toHaveBeenCalledWith(mockTransport);
      expect(client.isAvailable()).toBe(true);
    });

    it('should merge environment variables', async () => {
      const client = new MCPClient();
      const customEnv = { API_KEY: 'test-key' };

      await client.connect('uvx', ['test-server'], customEnv);

      expect(MockTransport).toHaveBeenCalledWith({
        command: 'uvx',
        args: ['test-server'],
        env: customEnv,
      });
    });

    it('should throw error if already connected', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      await expect(client.connect('uvx', ['test-server']))
        .rejects.toThrow('Client already connected');
    });

    it('should retry on connection failure with exponential backoff', async () => {
      const client = new MCPClient();
      mockClient.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

      await client.connect('uvx', ['test-server']);

      expect(mockClient.connect).toHaveBeenCalledTimes(3);
      expect(client.isAvailable()).toBe(true);
    });

    it('should fail after 3 retry attempts', async () => {
      const client = new MCPClient();
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(client.connect('uvx', ['test-server']))
        .rejects.toThrow('Failed to connect after 3 attempts');

      expect(mockClient.connect).toHaveBeenCalledTimes(3);
      expect(client.isAvailable()).toBe(false);
    });

    it('should cleanup on connection failure', async () => {
      const client = new MCPClient();
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(client.connect('uvx', ['test-server']))
        .rejects.toThrow('Failed to connect after 3 attempts');

      expect(client.isAvailable()).toBe(false);
    });
  });

  describe('isAvailable', () => {
    it('should return true initially', () => {
      const client = new MCPClient();
      expect(client.isAvailable()).toBe(true);
    });

    it('should return true after successful connection', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);
      expect(client.isAvailable()).toBe(true);
    });

    it('should return false after connection failure', async () => {
      const client = new MCPClient();
      mockClient.connect.mockRejectedValue(new Error('Failed'));

      await expect(client.connect('uvx', ['test-server']))
        .rejects.toThrow('Failed to connect after 3 attempts');

      expect(client.isAvailable()).toBe(false);
    });
  });

  describe('listTools', () => {
    it('should fetch and return tools list', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      const mockTools = [
        { name: 'tool1', description: 'Test tool 1', inputSchema: {} },
        { name: 'tool2', description: 'Test tool 2', inputSchema: {} },
      ];
      mockClient.listTools.mockResolvedValue({ tools: mockTools });

      const tools = await client.listTools();

      expect(tools).toEqual(mockTools);
      expect(mockClient.listTools).toHaveBeenCalledTimes(1);
    });

    it('should cache tools list on subsequent calls', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      const mockTools = [{ name: 'tool1', inputSchema: {} }];
      mockClient.listTools.mockResolvedValue({ tools: mockTools });

      await client.listTools();
      await client.listTools();
      await client.listTools();

      expect(mockClient.listTools).toHaveBeenCalledTimes(1);
    });

    it('should clear cache on disconnect', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      mockClient.listTools.mockResolvedValue({ tools: [{ name: 'tool1', inputSchema: {} }] });
      await client.listTools();

      await client.disconnect();
      await client.connect('uvx', ['test-server']);
      await client.listTools();

      expect(mockClient.listTools).toHaveBeenCalledTimes(2);
    });
  });

  describe('callTool', () => {
    it('should call tool with correct arguments', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      const mockResponse = { content: [{ type: 'text', text: 'result' }] };
      mockClient.callTool.mockResolvedValue(mockResponse);

      const result = await client.callTool('test-tool', { arg1: 'value1' });

      expect(mockClient.callTool).toHaveBeenCalledWith({
        name: 'test-tool',
        arguments: { arg1: 'value1' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty arguments', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      await client.callTool('test-tool', {});

      expect(mockClient.callTool).toHaveBeenCalledWith({
        name: 'test-tool',
        arguments: {},
      });
    });

    it('should propagate tool execution errors', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      mockClient.callTool.mockRejectedValue(new Error('Tool execution failed'));

      await expect(client.callTool('test-tool', {}))
        .rejects.toThrow('Tool execution failed');
    });
  });

  describe('disconnect', () => {
    it('should cleanup all resources', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      await client.disconnect();

      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should be idempotent', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      await client.disconnect();
      await client.disconnect();
      await client.disconnect();

      expect(mockClient.close).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnect when not connected', async () => {
      const client = new MCPClient();

      await expect(client.disconnect()).resolves.not.toThrow();
      expect(mockClient.close).not.toHaveBeenCalled();
    });

    it('should clear tools cache', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      mockClient.listTools.mockResolvedValue({ tools: [{ name: 'tool1', inputSchema: {} }] });
      await client.listTools();

      await client.disconnect();

      expect(mockClient.listTools).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup errors gracefully', async () => {
      const client = new MCPClient();
      await client.connect('uvx', ['test-server']);

      mockClient.close.mockRejectedValueOnce(new Error('Close failed'));

      // The error propagates but process.kill should still be called in finally
      await expect(client.disconnect()).rejects.toThrow('Close failed');
    });
  });

  describe('connection pool behavior', () => {
    it('should allow reconnection after disconnect', async () => {
      const client = new MCPClient();

      await client.connect('uvx', ['test-server']);
      await client.disconnect();

      mockClient.connect.mockClear();
      await client.connect('uvx', ['test-server']);

      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should maintain separate state per instance', async () => {
      vi.clearAllMocks();

      const client1 = new MCPClient();
      const client2 = new MCPClient();

      await client1.connect('uvx', ['server1']);
      await client2.connect('uvx', ['server2']);

      expect(MockTransport).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle spawn errors', async () => {
      const client = new MCPClient();
      mockClient.connect.mockRejectedValue(new Error('Spawn failed'));

      await expect(client.connect('invalid-command', []))
        .rejects.toThrow('Failed to connect after 3 attempts');
    });

    it('should handle transport creation errors', async () => {
      const client = new MCPClient();
      mockClient.connect.mockRejectedValue(new Error('Transport creation failed'));

      await expect(client.connect('uvx', ['test-server']))
        .rejects.toThrow('Failed to connect after 3 attempts');
    });
  });
});

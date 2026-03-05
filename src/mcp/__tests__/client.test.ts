import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPClient } from '../client.js';
import { RetryMCPClient } from '../retry-client.js';

vi.mock('@modelcontextprotocol/sdk/client/index.js');
vi.mock('@modelcontextprotocol/sdk/client/stdio.js');

describe('MCPClient', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient();
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('Connection', () => {
    it('should initialize client', () => {
      expect(client).toBeDefined();
    });

    it('should have connect method', () => {
      expect(client.connect).toBeTypeOf('function');
    });

    it('should handle disconnect when not connected', async () => {
      await expect(client.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Tool Discovery', () => {
    it('should have listTools method', () => {
      expect(client.listTools).toBeTypeOf('function');
    });

    it('should clear cache on disconnect', async () => {
      await client.disconnect();
      expect((client as any).toolsCache).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle disconnect gracefully', async () => {
      await expect(client.disconnect()).resolves.toBeUndefined();
    });

    it('should clear cache on disconnect', async () => {
      await client.disconnect();
      expect((client as any).toolsCache).toBeNull();
    });
  });
});

describe('RetryMCPClient', () => {
  let client: RetryMCPClient;

  beforeEach(() => {
    client = new RetryMCPClient({ maxRetries: 2, initialDelay: 100 });
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('Initialization', () => {
    it('should initialize with retry config', () => {
      expect(client).toBeDefined();
    });

    it('should have default retry config', () => {
      const defaultClient = new RetryMCPClient();
      expect(defaultClient).toBeDefined();
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry on connection failure', async () => {
      const connectSpy = vi.spyOn(MCPClient.prototype, 'connect')
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'));

      await expect(client.connect('test', [])).rejects.toThrow('Failed to connect after 3 attempts');
      connectSpy.mockRestore();
    });

    it('should calculate exponential backoff delay', () => {
      const delay1 = (client as any).calculateDelay(0);
      const delay2 = (client as any).calculateDelay(1);
      expect(delay2).toBeGreaterThan(delay1);
    });
  });

  describe('Health Check', () => {
    it('should have healthCheck method', () => {
      expect(client.healthCheck).toBeTypeOf('function');
    });

    it('should return false when listTools fails', async () => {
      vi.spyOn(client, 'listTools').mockRejectedValue(new Error('Failed'));
      const result = await client.healthCheck();
      expect(result).toBe(false);
    });

    it('should return true when listTools succeeds', async () => {
      vi.spyOn(client, 'listTools').mockResolvedValue([]);
      const result = await client.healthCheck();
      expect(result).toBe(true);
    });
  });

  describe('Reconnect', () => {
    it('should have reconnect method', () => {
      expect(client.reconnect).toBeTypeOf('function');
    });

    it('should throw if no connection params', async () => {
      await expect(client.reconnect()).rejects.toThrow('No connection parameters available');
    });

    it('should reconnect with stored params', async () => {
      const connectSpy = vi.spyOn(MCPClient.prototype, 'connect').mockResolvedValue(undefined);
      const disconnectSpy = vi.spyOn(client, 'disconnect').mockResolvedValue(undefined);

      await client.connect('test', ['arg']);
      connectSpy.mockClear();

      await client.reconnect();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(connectSpy).toHaveBeenCalledWith('test', ['arg'], undefined);

      connectSpy.mockRestore();
      disconnectSpy.mockRestore();
    });
  });
});

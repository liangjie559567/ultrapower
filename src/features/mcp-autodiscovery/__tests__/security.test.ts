import { describe, it, expect } from 'vitest';
import { ConfigInjector } from '../config-injector';
import { MCPRegistryClient } from '../registry-client';

describe('Security Tests', () => {
  describe('ConfigInjector - Command Injection Prevention', () => {
    const injector = new ConfigInjector();

    it('should reject package names with shell metacharacters', () => {
      expect(() => injector.generateConfig({
        id: 'malicious',
        name: 'Malicious',
        package: { type: 'uvx', name: 'package; rm -rf /' }
      })).toThrow('Invalid package name');
    });

    it('should reject package names with backticks', () => {
      expect(() => injector.generateConfig({
        id: 'malicious',
        name: 'Malicious',
        package: { type: 'npm', name: '`whoami`' }
      })).toThrow('Invalid package name');
    });

    it('should reject package names with pipes', () => {
      expect(() => injector.generateConfig({
        id: 'malicious',
        name: 'Malicious',
        package: { type: 'docker', name: 'image | cat /etc/passwd' }
      })).toThrow('Invalid package name');
    });

    it('should accept valid package names', () => {
      expect(() => injector.generateConfig({
        id: 'valid',
        name: 'Valid',
        package: { type: 'uvx', name: '@modelcontextprotocol/server-memory' }
      })).not.toThrow();

      expect(() => injector.generateConfig({
        id: 'valid',
        name: 'Valid',
        package: { type: 'npm', name: 'mcp-server-fetch' }
      })).not.toThrow();
    });
  });

  describe('MCPRegistryClient - HTTP Error Handling', () => {
    it('should throw on non-200 responses', async () => {
      const client = new MCPRegistryClient();

      // Mock fetch to return 500 error
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }) as Response;

      await expect(client.listServers()).rejects.toThrow('Registry API error: 500');

      global.fetch = originalFetch;
    });
  });
});

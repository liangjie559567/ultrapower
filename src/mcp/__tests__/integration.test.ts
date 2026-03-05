import { describe, it, expect, beforeEach } from 'vitest';
import { omcToolsServer } from '../omc-tools-server.js';

describe('MCP Integration Tests', () => {
  let server: typeof omcToolsServer;

  beforeEach(() => {
    server = omcToolsServer;
  });

  describe('Server Initialization', () => {
    it('starts server successfully', () => {
      expect(server).toBeDefined();
      expect(server.type).toBe('sdk');
      expect(server.name).toBe('t');
      expect(server.instance).toBeDefined();
    });

    it('exposes MCP server instance', () => {
      expect(server.instance).toBeDefined();
      expect(server.instance.server).toBeDefined();
    });
  });

  describe('Request/Response Helpers', () => {
    it('server has capabilities method', () => {
      expect(server.instance.server.getCapabilities).toBeTypeOf('function');
    });

    it('can get server capabilities', () => {
      const capabilities = server.instance.server.getCapabilities();
      expect(capabilities).toBeDefined();
    });
  });
});

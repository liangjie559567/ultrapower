import { describe, it, expect } from 'vitest';
import { omcToolsServer, omcToolNames } from '../omc-tools-server.js';

describe('MCP Server Startup', () => {
  it('initializes server with correct metadata', () => {
    expect(omcToolsServer).toBeDefined();
    expect(omcToolsServer.type).toBe('sdk');
    expect(omcToolsServer.name).toBe('t');
  });

  it('has server instance', () => {
    expect(omcToolsServer.instance).toBeDefined();
  });

  it('returns tool names array', () => {
    expect(omcToolNames).toBeDefined();
    expect(Array.isArray(omcToolNames)).toBe(true);
    expect(omcToolNames.length).toBeGreaterThan(0);
    expect(omcToolNames.every(name => name.startsWith('mcp__t__'))).toBe(true);
  });
});

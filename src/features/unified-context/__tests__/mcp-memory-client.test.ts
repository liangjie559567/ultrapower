import { describe, it, expect, beforeEach } from 'vitest';
import { MCPMemoryClient } from '../mcp-memory-client';

describe('MCPMemoryClient', () => {
  let client: MCPMemoryClient;

  beforeEach(() => {
    client = new MCPMemoryClient();
  });

  it('should connect to MCP Memory server', async () => {
    await expect(client.connect()).resolves.not.toThrow();
  });

  it('should store and retrieve context', async () => {
    await client.connect();
    await client.storeContext('test-key', { data: 'test-value' });
    const result = await client.getContext('test-key');
    expect(result).toEqual({ data: 'test-value' });
  });

  it('should create knowledge graph entities', async () => {
    await client.connect();
    const entityId = await client.createEntity({
      name: 'test-entity',
      type: 'context',
      observations: ['test observation']
    });
    expect(entityId).toBeDefined();
  });
});

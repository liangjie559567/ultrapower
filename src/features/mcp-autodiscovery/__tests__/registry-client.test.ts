import { describe, it, expect } from 'vitest';
import { MCPRegistryClient } from '../registry-client';

describe('MCPRegistryClient', () => {
  it('should fetch servers from registry', async () => {
    const client = new MCPRegistryClient();
    const servers = await client.listServers();
    expect(servers).toBeInstanceOf(Array);
  }, 60000);

  it('should search by capability', async () => {
    const client = new MCPRegistryClient();
    const servers = await client.searchByCapability('web-scraping');
    expect(servers.length).toBeGreaterThan(0);
  }, 60000);

  it('should handle official filter query', async () => {
    const client = new MCPRegistryClient();
    const servers = await client.listServers({ official: true });
    expect(servers).toBeInstanceOf(Array);
  }, 60000);
});

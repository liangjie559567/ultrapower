import type { MCPServerDescriptor, CapabilityQuery } from './types.js';

const REGISTRY_API = 'https://registry.modelcontextprotocol.io/v0.1';

export class MCPRegistryClient {
  private cache: Map<string, MCPServerDescriptor[]> = new Map();
  private cacheExpiry = 3600000; // 1 hour

  async listServers(query?: CapabilityQuery): Promise<MCPServerDescriptor[]> {
    const cacheKey = JSON.stringify(query || {});
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    if (query?.capability) params.set('capability', query.capability);
    if (query?.search) params.set('search', query.search);
    if (query?.official !== undefined) params.set('official', String(query.official));

    const response = await fetch(`${REGISTRY_API}/servers?${params}`);
    const data = await response.json() as { servers: MCPServerDescriptor[] };

    this.cache.set(cacheKey, data.servers);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry);

    return data.servers;
  }

  async searchByCapability(capability: string): Promise<MCPServerDescriptor[]> {
    return this.listServers({ capability });
  }

  async getServerById(id: string): Promise<MCPServerDescriptor | null> {
    const servers = await this.listServers();
    return servers.find(s => s.id === id) || null;
  }
}

const REGISTRY_API = 'https://registry.modelcontextprotocol.io/v0.1';
export class MCPRegistryClient {
    cache = new Map();
    cacheExpiry = 3600000; // 1 hour
    async listServers(query) {
        const cacheKey = JSON.stringify(query || {});
        const cached = this.cache.get(cacheKey);
        if (cached)
            return cached;
        const params = new URLSearchParams();
        if (query?.capability)
            params.set('capability', query.capability);
        if (query?.search)
            params.set('search', query.search);
        if (query?.official !== undefined)
            params.set('official', String(query.official));
        const response = await fetch(`${REGISTRY_API}/servers?${params}`);
        if (!response.ok) {
            throw new Error(`Registry API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        this.cache.set(cacheKey, data.servers);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry);
        return data.servers;
    }
    async searchByCapability(capability) {
        return this.listServers({ capability });
    }
    async getServerById(id) {
        const servers = await this.listServers();
        return servers.find(s => s.id === id) || null;
    }
}
//# sourceMappingURL=registry-client.js.map
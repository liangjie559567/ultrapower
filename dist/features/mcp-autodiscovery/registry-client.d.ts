import type { MCPServerDescriptor, CapabilityQuery } from './types.js';
export declare class MCPRegistryClient {
    private cache;
    private cacheExpiry;
    listServers(query?: CapabilityQuery): Promise<MCPServerDescriptor[]>;
    searchByCapability(capability: string): Promise<MCPServerDescriptor[]>;
    getServerById(id: string): Promise<MCPServerDescriptor | null>;
}
//# sourceMappingURL=registry-client.d.ts.map
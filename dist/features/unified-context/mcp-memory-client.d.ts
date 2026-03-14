export declare class MCPMemoryClient {
    private client;
    private transport;
    connect(): Promise<void>;
    storeContext(key: string, value: unknown): Promise<void>;
    getContext(key: string): Promise<unknown>;
    createEntity(entity: {
        name: string;
        type: string;
        observations: string[];
    }): Promise<string>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=mcp-memory-client.d.ts.map
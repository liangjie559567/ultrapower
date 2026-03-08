/**
 * MCP Client for connecting to external MCP servers
 */
interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
export declare class MCPClient {
    private client;
    private transport;
    private toolsCache;
    constructor();
    connect(command: string, args?: string[], env?: Record<string, string>): Promise<void>;
    listTools(): Promise<MCPTool[]>;
    disconnect(): Promise<void>;
}
export {};
//# sourceMappingURL=client.d.ts.map
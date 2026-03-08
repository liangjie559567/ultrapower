interface MCPTool {
    name: string;
    description?: string;
    inputSchema: Record<string, unknown>;
}
export declare class MCPClient {
    private client;
    private transport;
    private toolsCache;
    private connected;
    private available;
    constructor();
    connect(command: string, args?: string[], env?: Record<string, string>): Promise<void>;
    private attemptConnect;
    isAvailable(): boolean;
    listTools(): Promise<MCPTool[]>;
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    disconnect(): Promise<void>;
}
export {};
//# sourceMappingURL=MCPClient.d.ts.map
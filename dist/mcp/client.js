/**
 * MCP Client for connecting to external MCP servers
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
export class MCPClient {
    client;
    transport = null;
    toolsCache = null;
    constructor() {
        this.client = new Client({ name: 'ultrapower-mcp-client', version: '1.0.0' }, { capabilities: {} });
    }
    async connect(command, args = [], env) {
        this.transport = new StdioClientTransport({ command, args, env });
        await this.transport.start();
        await this.client.connect(this.transport);
    }
    async listTools() {
        if (this.toolsCache) {
            return this.toolsCache;
        }
        const response = await this.client.listTools();
        this.toolsCache = response.tools;
        return this.toolsCache;
    }
    async disconnect() {
        if (this.transport) {
            await this.client.close();
            // @ts-expect-error - removeAllListeners exists on EventEmitter
            this.client.removeAllListeners?.();
            this.transport = null;
            this.toolsCache = null;
        }
    }
}
//# sourceMappingURL=client.js.map
/**
 * MCP Client for connecting to external MCP servers
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private toolsCache: MCPTool[] | null = null;

  constructor() {
    this.client = new Client(
      { name: 'ultrapower-mcp-client', version: '1.0.0' },
      { capabilities: {} }
    );
  }

  async connect(command: string, args: string[] = [], env?: Record<string, string>): Promise<void> {
    this.transport = new StdioClientTransport({ command, args, env });
    await this.transport.start();
    await this.client.connect(this.transport);
  }

  async listTools(): Promise<MCPTool[]> {
    if (this.toolsCache) {
      return this.toolsCache;
    }
    const response = await this.client.listTools();
    this.toolsCache = response.tools as MCPTool[];
    return this.toolsCache;
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.client.close();
      // @ts-ignore - removeAllListeners exists on EventEmitter
      this.client.removeAllListeners?.();
      this.transport = null;
      this.toolsCache = null;
    }
  }
}

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPMemoryClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async connect(): Promise<void> {
    this.transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory']
    });

    this.client = new Client({
      name: 'ultrapower-memory-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await this.client.connect(this.transport);
  }

  async storeContext(key: string, value: unknown): Promise<void> {
    if (!this.client) throw new Error('Not connected');

    await this.client.callTool({
      name: 'create_entities',
      arguments: {
        entities: [{
          name: key,
          entityType: 'context',
          observations: [JSON.stringify(value)]
        }]
      }
    });
  }

  async getContext(key: string): Promise<unknown> {
    if (!this.client) throw new Error('Not connected');

    const result = await this.client.callTool({
      name: 'search_nodes',
      arguments: { query: key }
    });

    const structured = result.structuredContent as { entities?: Array<{ observations?: string[] }> } | undefined;
    if (structured?.entities?.[0]?.observations?.[0]) {
      return JSON.parse(structured.entities[0].observations[0]);
    }
    return null;
  }

  async createEntity(entity: {
    name: string;
    type: string;
    observations: string[];
  }): Promise<string> {
    if (!this.client) throw new Error('Not connected');

    await this.client.callTool({
      name: 'create_entities',
      arguments: {
        entities: [{
          name: entity.name,
          entityType: entity.type,
          observations: entity.observations
        }]
      }
    });

    return entity.name;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}

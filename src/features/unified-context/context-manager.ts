import { MCPMemoryClient } from './mcp-memory-client.js';

interface AgentContext {
  [key: string]: unknown;
}

interface Relation {
  from: string;
  type: string;
  to: string;
}

export class UnifiedContextManager {
  private memoryClient: MCPMemoryClient;
  private initialized = false;
  private contextCache: Map<string, AgentContext> = new Map();
  private relationsCache: Map<string, Relation[]> = new Map();

  constructor() {
    this.memoryClient = new MCPMemoryClient();
  }

  async initialize(): Promise<void> {
    await this.memoryClient.connect();
    this.initialized = true;
  }

  async setAgentContext(agentId: string, context: AgentContext): Promise<void> {
    if (!this.initialized) throw new Error('Not initialized');
    await this.memoryClient.storeContext(`agent-context-${agentId}`, context);
    this.contextCache.set(agentId, context);
  }

  async getSharedContext(): Promise<Record<string, AgentContext>> {
    if (!this.initialized) throw new Error('Not initialized');
    const result: Record<string, AgentContext> = {};
    for (const [agentId, context] of this.contextCache.entries()) {
      result[agentId] = context;
    }
    return result;
  }

  async getAllAgentContexts(): Promise<AgentContext[]> {
    if (!this.initialized) throw new Error('Not initialized');
    return Array.from(this.contextCache.values());
  }

  async createRelation(from: string, type: string, to: string): Promise<void> {
    if (!this.initialized) throw new Error('Not initialized');
    await this.memoryClient.createEntity({
      name: `relation-${from}-${to}`,
      type: 'relation',
      observations: [JSON.stringify({ from, type, to })]
    });

    if (!this.relationsCache.has(from)) {
      this.relationsCache.set(from, []);
    }
    this.relationsCache.get(from)!.push({ from, type, to });
  }

  async getRelations(entityId: string): Promise<Relation[]> {
    if (!this.initialized) throw new Error('Not initialized');
    return this.relationsCache.get(entityId) || [];
  }

  async shutdown(): Promise<void> {
    await this.memoryClient.disconnect();
    this.initialized = false;
    this.contextCache.clear();
    this.relationsCache.clear();
  }
}

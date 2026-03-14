import { MCPMemoryClient } from './mcp-memory-client.js';
export class UnifiedContextManager {
    memoryClient;
    initialized = false;
    contextCache = new Map();
    relationsCache = new Map();
    constructor() {
        this.memoryClient = new MCPMemoryClient();
    }
    async initialize() {
        await this.memoryClient.connect();
        this.initialized = true;
    }
    async setAgentContext(agentId, context) {
        if (!this.initialized)
            throw new Error('Not initialized');
        await this.memoryClient.storeContext(`agent-context-${agentId}`, context);
        this.contextCache.set(agentId, context);
    }
    async getSharedContext() {
        if (!this.initialized)
            throw new Error('Not initialized');
        const result = {};
        for (const [agentId, context] of this.contextCache.entries()) {
            result[agentId] = context;
        }
        return result;
    }
    async getAllAgentContexts() {
        if (!this.initialized)
            throw new Error('Not initialized');
        return Array.from(this.contextCache.values());
    }
    async createRelation(from, type, to) {
        if (!this.initialized)
            throw new Error('Not initialized');
        await this.memoryClient.createEntity({
            name: `relation-${from}-${to}`,
            type: 'relation',
            observations: [JSON.stringify({ from, type, to })]
        });
        if (!this.relationsCache.has(from)) {
            this.relationsCache.set(from, []);
        }
        this.relationsCache.get(from).push({ from, type, to });
    }
    async getRelations(entityId) {
        if (!this.initialized)
            throw new Error('Not initialized');
        return this.relationsCache.get(entityId) || [];
    }
    async shutdown() {
        await this.memoryClient.disconnect();
        this.initialized = false;
        this.contextCache.clear();
        this.relationsCache.clear();
    }
}
//# sourceMappingURL=context-manager.js.map
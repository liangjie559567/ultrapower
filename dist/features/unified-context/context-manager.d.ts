interface AgentContext {
    [key: string]: unknown;
}
interface Relation {
    from: string;
    type: string;
    to: string;
}
export declare class UnifiedContextManager {
    private memoryClient;
    private initialized;
    private contextCache;
    private relationsCache;
    constructor();
    initialize(): Promise<void>;
    setAgentContext(agentId: string, context: AgentContext): Promise<void>;
    getSharedContext(): Promise<Record<string, AgentContext>>;
    getAllAgentContexts(): Promise<AgentContext[]>;
    createRelation(from: string, type: string, to: string): Promise<void>;
    getRelations(entityId: string): Promise<Relation[]>;
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=context-manager.d.ts.map
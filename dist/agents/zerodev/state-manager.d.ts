export declare class ZeroDevStateManager {
    private stateDir;
    readState<T>(agentType: string, sessionId: string): Promise<T | null>;
    writeState<T>(agentType: string, sessionId: string, state: T): Promise<void>;
    clearState(agentType: string, sessionId: string): Promise<void>;
}
//# sourceMappingURL=state-manager.d.ts.map
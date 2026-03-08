export interface NexusSessionEndInput {
    sessionId: string;
    directory: string;
    durationMs?: number;
    agentsSpawned?: number;
    agentsCompleted?: number;
    modesUsed?: string[];
    skillsInjected?: string[];
}
export interface NexusSessionEndResult {
    collected: boolean;
    synced: boolean;
    error?: string;
}
export declare function handleNexusSessionEnd(input: NexusSessionEndInput): Promise<NexusSessionEndResult>;
//# sourceMappingURL=session-end-hook.d.ts.map
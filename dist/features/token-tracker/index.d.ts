interface TokenRecord {
    sessionId: string;
    timestamp: number;
    inputTokens: number;
    outputTokens: number;
    model: string;
}
interface Stats {
    totalInput: number;
    totalOutput: number;
    recordCount: number;
    models: Record<string, {
        input: number;
        output: number;
    }>;
}
export declare function logTokenUsage(record: TokenRecord): Promise<void>;
export declare function getSessionStats(sessionId: string): Promise<Stats>;
export declare function getAllStats(): Promise<Stats>;
export {};
//# sourceMappingURL=index.d.ts.map
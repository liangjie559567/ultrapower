export interface SyncResult {
    success: boolean;
    error?: string;
    filesCommitted?: number;
}
export declare function buildGitCommitMessage(sessionId: string, fileCount: number): string;
export declare function syncToRemote(directory: string, sessionId: string): Promise<SyncResult>;
//# sourceMappingURL=consciousness-sync.d.ts.map
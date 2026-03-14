export interface QualityCheckResult {
    passed: boolean;
    issues: string[];
    score: number;
}
/**
 * Synchronous quality gate check for hook context
 */
export declare function runQualityGateSync(files: string[], cwd: string, skipRequested?: boolean): QualityCheckResult;
//# sourceMappingURL=quality-gate-sync.d.ts.map
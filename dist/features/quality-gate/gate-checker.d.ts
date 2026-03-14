export interface QualityCheckResult {
    passed: boolean;
    issues: string[];
    score: number;
}
export declare function runQualityGate(files: string[], cwd: string, skipRequested?: boolean): Promise<QualityCheckResult>;
//# sourceMappingURL=gate-checker.d.ts.map
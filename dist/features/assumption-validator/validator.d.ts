export interface Assumption {
    id: string;
    description: string;
    verificationMethod: 'code' | 'documentation';
    verified: boolean;
    evidence?: string;
}
export interface ValidationResult {
    valid: boolean;
    failedAssumptions: Assumption[];
    shouldStop: boolean;
}
export declare function validateAssumptions(assumptions: Assumption[]): ValidationResult;
//# sourceMappingURL=validator.d.ts.map
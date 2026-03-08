export interface CIResult {
    success: boolean;
    errors: string[];
    warnings: string[];
}
export declare function runCIValidation(): Promise<CIResult>;
//# sourceMappingURL=ci-validator.d.ts.map
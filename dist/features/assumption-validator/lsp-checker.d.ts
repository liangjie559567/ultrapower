export interface LSPCheckResult {
    hasErrors: boolean;
    errors: string[];
}
export declare function checkWithLSP(filePath: string): Promise<LSPCheckResult>;
//# sourceMappingURL=lsp-checker.d.ts.map
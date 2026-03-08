export declare function getDocPath(type: string): string;
export declare function createDocFromTemplate(type: string, vars: Record<string, string>): Promise<string>;
export declare function batchCreateDocs(requests: Array<{
    type: string;
    vars: Record<string, string>;
}>): Promise<string[]>;
//# sourceMappingURL=doc-manager.d.ts.map
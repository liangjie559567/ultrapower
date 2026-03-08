declare const ALLOWED_DOC_TYPES: readonly ["requirements", "tech-design", "feature-flow", "modification-plan", "optimization-list", "test-checklist", "dev-module"];
type DocType = typeof ALLOWED_DOC_TYPES[number];
export interface CCGInput {
    workingDir: string;
    projectType?: 'new' | 'old';
    docType?: DocType;
    vars?: Record<string, string>;
}
export declare function sanitizeCCGInput(raw: unknown): CCGInput;
export declare function assertValidDocType(type: unknown): DocType;
export {};
//# sourceMappingURL=input-sanitizer.d.ts.map
/**
 * harvester.ts — 知识收割器
 *
 * 从 Axiom harvester.py 移植。从对话历史和代码变更中提取可复用知识。
 */
export type KnowledgeCategory = 'architecture' | 'debugging' | 'pattern' | 'workflow' | 'tooling';
export type SourceType = 'code_change' | 'error_fix' | 'workflow_run' | 'user_feedback' | 'conversation';
export interface KnowledgeEntry {
    id: string;
    title: string;
    category: KnowledgeCategory;
    tags: string[];
    confidence: number;
    summary: string;
    details: string;
    codeExample: string;
    related: string[];
    references: string[];
    created: string;
}
export declare class KnowledgeHarvester {
    private readonly knowledgeDir;
    constructor(baseDir?: string);
    nextId(): Promise<string>;
    harvest(sourceType: SourceType, title: string, summary: string, options?: {
        category?: KnowledgeCategory;
        tags?: string[];
        details?: string;
        codeExample?: string;
        related?: string[];
        confidence?: number;
    }): Promise<KnowledgeEntry>;
    harvestFromErrorFix(errorType: string, rootCause: string, solution: string, tags?: string[]): Promise<KnowledgeEntry>;
    listEntries(): Promise<Array<Record<string, string>>>;
    search(query: string): Promise<Array<Record<string, string>>>;
    private saveEntry;
}
//# sourceMappingURL=harvester.d.ts.map
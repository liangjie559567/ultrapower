/**
 * seed-knowledge.ts — 种子知识初始化器
 *
 * 从 Axiom seed_knowledge.py 移植。从 knowledge_base.md 加载种子知识条目。
 */
import type { KnowledgeEntry } from './harvester.js';
export interface SeedResult {
    seeded: number;
    skipped: number;
    entries: KnowledgeEntry[];
}
export declare class SeedKnowledge {
    private readonly harvester;
    private readonly knowledgeBaseFile;
    constructor(baseDir?: string);
    seed(force?: boolean): Promise<SeedResult>;
    private loadSeedItems;
    private getBuiltinSeeds;
}
//# sourceMappingURL=seed-knowledge.d.ts.map
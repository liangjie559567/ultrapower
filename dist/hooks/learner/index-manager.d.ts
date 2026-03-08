/**
 * index-manager.ts — 知识索引管理器
 *
 * 从 Axiom index_manager.py 移植。管理 .omc/knowledge/ 目录的索引文件。
 */
export interface IndexEntry {
    id: string;
    title: string;
    category: string;
    confidence: number;
    created: string;
    file: string;
}
export declare class KnowledgeIndexManager {
    private readonly knowledgeDir;
    private readonly indexFile;
    constructor(baseDir?: string);
    rebuildIndex(): Promise<IndexEntry[]>;
    addToIndex(entry: IndexEntry): Promise<void>;
    /** 从索引中移除指定条目（对齐 Python remove_from_index） */
    removeFromIndex(id: string): Promise<void>;
    /** 更新指定条目的置信度（对齐 Python update_confidence） */
    updateConfidence(id: string, newConfidence: number): Promise<void>;
    /**
     * 按关键词过滤知识库条目（对齐 --filter 参数）。
     *
     * 匹配规则：title 或 category 包含关键词（includes，大小写不敏感）。
     * 关键词长度超过 256 字符时抛出 Error。
     */
    filterByKeyword(keyword: string): Promise<{
        entries: IndexEntry[];
        total: number;
    }>;
    /**
     * 按分类精确过滤知识库条目（对齐 --category 参数）。
     *
     * 匹配规则：category 字段精确匹配（大小写不敏感）。
     */
    filterByCategory(category: string): Promise<{
        entries: IndexEntry[];
        total: number;
    }>;
    loadIndex(): Promise<IndexEntry[]>;
    private writeIndex;
}
export interface ImportResult {
    imported: number;
    skipped: number;
    namespace: string;
}
/**
 * 从外部 JSON 文件导入知识条目，以 namespace 隔离追加到索引。
 * 重复 id（同 namespace）跳过。
 */
export declare function importKnowledge(filePath: string, namespace: string, baseDir?: string): Promise<ImportResult>;
//# sourceMappingURL=index-manager.d.ts.map
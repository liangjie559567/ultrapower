/**
 * 知识检索器 - 混合检索策略
 * relevance_score = (vector_similarity × 0.7) + (time_decay × 0.2) + (usage_frequency × 0.1)
 */
/**
 * 语义检索相关知识（top 5）
 */
export declare function retrieveRelevantKnowledge(directory: string, query: string): Promise<Array<{
    content: string;
    score: number;
}>>;
//# sourceMappingURL=knowledge-retriever.d.ts.map
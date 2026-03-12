/**
 * Prompt Optimizer - 优化 LLM prompt 以减少 token 使用
 */
export interface OptimizationOptions {
    maxContextFiles?: number;
    preferInterfaces?: boolean;
    structuredOutput?: boolean;
    limitExamples?: number;
}
export interface OptimizedPrompt {
    prompt: string;
    contextFiles: string[];
    estimatedTokens: number;
    optimizations: string[];
}
/**
 * 优化 prompt 文本
 */
export declare function optimizePromptText(prompt: string): {
    text: string;
    changes: string[];
};
/**
 * 优化上下文文件列表
 */
export declare function optimizeContextFiles(files: string[], options?: OptimizationOptions): {
    files: string[];
    changes: string[];
};
/**
 * 估算 token 数量（粗略估计：1 token ≈ 4 字符）
 */
export declare function estimateTokens(text: string): number;
/**
 * 完整优化流程
 */
export declare function optimizePrompt(prompt: string, contextFiles: string[], options?: OptimizationOptions): OptimizedPrompt;
//# sourceMappingURL=index.d.ts.map
/**
 * Workflow Recommender Integration
 * 扩展工作流推荐引擎以支持 Spec Kit
 */
export interface SpecKitRecommendation {
    useSpecKit: boolean;
    currentStage?: string;
    nextStep?: string;
    confidence: number;
}
/**
 * 分析是否推荐使用 Spec Kit 工作流
 */
export declare function analyzeSpecKitFit(userInput: string, context: {
    hasConstitution?: boolean;
    hasSpecs?: boolean;
}): SpecKitRecommendation;
//# sourceMappingURL=recommender.d.ts.map
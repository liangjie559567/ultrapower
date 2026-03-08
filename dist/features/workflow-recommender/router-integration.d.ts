export interface RouterContext {
    currentSkill?: string;
    stage?: string;
    outputSummary?: string;
    taskCount?: number;
    keywords?: string[];
}
export declare function getNextStepRecommendation(context: RouterContext): import("./recommender.js").WorkflowRecommendation | null;
//# sourceMappingURL=router-integration.d.ts.map
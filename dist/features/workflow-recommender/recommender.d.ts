export interface WorkflowRecommendation {
    id: string;
    name: string;
    workflow: string;
    confidence: number;
    agents: string[];
    conditions?: {
        taskCount?: {
            min?: number;
            max?: number;
        };
        taskType?: string;
        priority?: string;
        keywords?: string[];
    };
}
export declare function getWorkflowRecommendation(context: {
    taskCount?: number;
    taskType?: string;
    keywords?: string[];
    priority?: string;
}): WorkflowRecommendation | null;
//# sourceMappingURL=recommender.d.ts.map
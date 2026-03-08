export interface WorkflowConfig {
    workingDir: string;
    maxOptimizationRounds?: number;
    maxTestingRounds?: number;
}
export declare class NewProjectWorkflow {
    private config;
    constructor(config: WorkflowConfig);
    execute(): Promise<void>;
}
//# sourceMappingURL=new-project-workflow.d.ts.map
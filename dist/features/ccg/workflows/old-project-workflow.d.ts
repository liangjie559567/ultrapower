export interface OldProjectWorkflowConfig {
    workingDir: string;
}
export declare class OldProjectWorkflow {
    private config;
    private moduleController;
    constructor(config: OldProjectWorkflowConfig);
    execute(): Promise<void>;
}
//# sourceMappingURL=old-project-workflow.d.ts.map
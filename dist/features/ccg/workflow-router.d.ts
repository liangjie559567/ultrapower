import { ProjectType } from './project-detector.js';
export interface WorkflowContext {
    workingDir: string;
    projectType: ProjectType;
    userInput?: string;
}
export declare function routeWorkflow(workingDir: string, manualType?: ProjectType): Promise<WorkflowContext>;
//# sourceMappingURL=workflow-router.d.ts.map
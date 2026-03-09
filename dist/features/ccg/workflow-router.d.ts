import { ProjectType } from './project-detector.js';
import { TechStack } from './tech-stack-detector.js';
import { ProjectStructure, StructureAnalysis } from './structure-analyzer.js';
import { assignTask, TaskAssignment, ModelType, ChangeType } from './task-assigner.js';
export interface WorkflowContext {
    workingDir: string;
    projectType: ProjectType;
    techStack?: TechStack;
    structure?: StructureAnalysis;
    taskAssignment?: TaskAssignment;
    userInput?: string;
}
export declare function routeWorkflow(workingDir: string, manualType?: ProjectType): Promise<WorkflowContext>;
export type { ProjectStructure, StructureAnalysis, ModelType, ChangeType, TaskAssignment };
export { assignTask };
//# sourceMappingURL=workflow-router.d.ts.map
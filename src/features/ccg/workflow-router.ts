import { detectProjectType, ProjectType } from './project-detector.js';
import { detectTechStack, TechStack } from './tech-stack-detector.js';
import { analyzeProjectStructure, ProjectStructure, StructureAnalysis } from './structure-analyzer.js';
import { assignTask, TaskAssignment, ModelType, ChangeType } from './task-assigner.js';

export interface WorkflowContext {
  workingDir: string;
  projectType: ProjectType;
  techStack?: TechStack;
  structure?: StructureAnalysis;
  taskAssignment?: TaskAssignment;
  userInput?: string;
}

export async function routeWorkflow(
  workingDir: string,
  manualType?: ProjectType
): Promise<WorkflowContext> {
  const detection = await detectProjectType(workingDir, manualType);
  const techStack = await detectTechStack(workingDir);
  const structure = await analyzeProjectStructure(workingDir, techStack);

  return {
    workingDir,
    projectType: detection.type,
    techStack,
    structure,
  };
}

export type { ProjectStructure, StructureAnalysis, ModelType, ChangeType, TaskAssignment };
export { assignTask };


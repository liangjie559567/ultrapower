import { detectProjectType, ProjectType } from './project-detector.js';
import { detectTechStack, TechStack } from './tech-stack-detector.js';

export interface WorkflowContext {
  workingDir: string;
  projectType: ProjectType;
  techStack?: TechStack;
  userInput?: string;
}

export async function routeWorkflow(
  workingDir: string,
  manualType?: ProjectType
): Promise<WorkflowContext> {
  const detection = await detectProjectType(workingDir, manualType);
  const techStack = await detectTechStack(workingDir);

  return {
    workingDir,
    projectType: detection.type,
    techStack,
  };
}

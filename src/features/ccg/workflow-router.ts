import { detectProjectType, ProjectType } from './project-detector.js';

export interface WorkflowContext {
  workingDir: string;
  projectType: ProjectType;
  userInput?: string;
}

export async function routeWorkflow(
  workingDir: string,
  manualType?: ProjectType
): Promise<WorkflowContext> {
  const detection = await detectProjectType(workingDir, manualType);

  return {
    workingDir,
    projectType: detection.type,
  };
}

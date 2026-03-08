import { routeWorkflow, WorkflowContext } from './workflow-router.js';
import { ProjectType } from './project-detector.js';
import { sanitizeCCGInput } from './input-sanitizer.js';

export async function executeCCGSkill(
  workingDir: string,
  args?: string
): Promise<void> {
  const sanitized = sanitizeCCGInput({
    workingDir,
    projectType: args as ProjectType | undefined
  });

  const context = await routeWorkflow(sanitized.workingDir, sanitized.projectType);

  console.log(`[CCG] Project type: ${context.projectType}`);
  console.log(`[CCG] Working directory: ${context.workingDir}`);

  if (context.projectType === 'new') {
    console.log('[CCG] Routing to new project workflow...');
    // TODO: T1.4 - Implement new project workflow
  } else {
    console.log('[CCG] Routing to old project workflow...');
    // TODO: T2.1 - Implement old project workflow
  }
}

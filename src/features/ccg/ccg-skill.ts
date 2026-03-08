import { routeWorkflow, WorkflowContext } from './workflow-router.js';
import { ProjectType } from './project-detector.js';
import { sanitizeCCGInput } from './input-sanitizer.js';
import { NewProjectWorkflow } from './workflows/new-project-workflow.js';
import { OldProjectWorkflow } from './workflows/old-project-workflow.js';

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
    const workflow = new NewProjectWorkflow({ workingDir: context.workingDir });
    await workflow.execute();
  } else {
    console.log('[CCG] Routing to old project workflow...');
    const workflow = new OldProjectWorkflow({ workingDir: context.workingDir });
    await workflow.execute();
  }
}

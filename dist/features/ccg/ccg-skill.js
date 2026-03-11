import { routeWorkflow } from './workflow-router.js';
import { sanitizeCCGInput } from './input-sanitizer.js';
import { NewProjectWorkflow } from './workflows/new-project-workflow.js';
import { OldProjectWorkflow } from './workflows/old-project-workflow.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('ccg:ccg-skill');
export async function executeCCGSkill(workingDir, args) {
    const sanitized = sanitizeCCGInput({
        workingDir,
        projectType: args
    });
    const context = await routeWorkflow(sanitized.workingDir, sanitized.projectType);
    logger.info(`[CCG] Project type: ${context.projectType}`);
    logger.info(`[CCG] Working directory: ${context.workingDir}`);
    if (context.projectType === 'new') {
        logger.info('[CCG] Routing to new project workflow...');
        const workflow = new NewProjectWorkflow({ workingDir: context.workingDir });
        await workflow.execute();
    }
    else {
        logger.info('[CCG] Routing to old project workflow...');
        const workflow = new OldProjectWorkflow({ workingDir: context.workingDir });
        await workflow.execute();
    }
}
//# sourceMappingURL=ccg-skill.js.map
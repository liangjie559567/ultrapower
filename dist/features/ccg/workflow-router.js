import { detectProjectType } from './project-detector.js';
import { detectTechStack } from './tech-stack-detector.js';
import { analyzeProjectStructure } from './structure-analyzer.js';
import { assignTask } from './task-assigner.js';
export async function routeWorkflow(workingDir, manualType) {
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
export { assignTask };
//# sourceMappingURL=workflow-router.js.map
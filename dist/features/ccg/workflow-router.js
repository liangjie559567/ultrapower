import { detectProjectType } from './project-detector.js';
export async function routeWorkflow(workingDir, manualType) {
    const detection = await detectProjectType(workingDir, manualType);
    return {
        workingDir,
        projectType: detection.type,
    };
}
//# sourceMappingURL=workflow-router.js.map
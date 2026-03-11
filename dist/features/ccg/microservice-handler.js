import { detectMicroservices } from './microservice-detector.js';
import { executeReadStatusPhase } from './workflows/phase-read-status.js';
import { executeModificationPlanPhase } from './workflows/phase-modification-plan.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('ccg:microservice-handler');
export async function handleMicroserviceProject(workingDir) {
    const services = await detectMicroservices(workingDir);
    if (services.length === 0) {
        throw new Error('No microservices detected');
    }
    for (const service of services) {
        await generateServiceDocs(service);
    }
    await generateDependencyGraph(services, workingDir);
}
async function generateServiceDocs(service) {
    await executeReadStatusPhase(service.path);
    await executeModificationPlanPhase(service.path);
}
async function generateDependencyGraph(services, workingDir) {
    const graph = services.map(s => ({
        service: s.name,
        depends_on: s.dependencies,
    }));
    logger.info('Service dependency graph:', JSON.stringify(graph, null, 2));
}
//# sourceMappingURL=microservice-handler.js.map
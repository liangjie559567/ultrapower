import { detectMicroservices, ServiceInfo } from './microservice-detector.js';
import { executeReadStatusPhase } from './workflows/phase-read-status.js';
import { executeModificationPlanPhase } from './workflows/phase-modification-plan.js';

export async function handleMicroserviceProject(workingDir: string): Promise<void> {
  const services = await detectMicroservices(workingDir);

  if (services.length === 0) {
    throw new Error('No microservices detected');
  }

  for (const service of services) {
    await generateServiceDocs(service);
  }

  await generateDependencyGraph(services, workingDir);
}

async function generateServiceDocs(service: ServiceInfo): Promise<void> {
  await executeReadStatusPhase(service.path);
  await executeModificationPlanPhase(service.path);
}

async function generateDependencyGraph(services: ServiceInfo[], workingDir: string): Promise<void> {
  const graph = services.map(s => ({
    service: s.name,
    depends_on: s.dependencies,
  }));

  console.log('Service dependency graph:', JSON.stringify(graph, null, 2));
}

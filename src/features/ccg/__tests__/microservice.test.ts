import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { detectMicroservices } from '../microservice-detector.js';
import { handleMicroserviceProject } from '../microservice-handler.js';
import { fileCache } from '../file-cache.js';

describe('Microservice Support', () => {
  const testDir = path.join(process.cwd(), '.test-microservices');

  beforeEach(async () => {
    fileCache.clear();
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should detect microservices', async () => {
    const serviceAPath = path.join(testDir, 'service-a');
    await fs.mkdir(serviceAPath, { recursive: true });
    await fs.writeFile(
      path.join(serviceAPath, 'package.json'),
      JSON.stringify({ name: 'service-a', dependencies: {} })
    );

    const services = await detectMicroservices(testDir);
    expect(services).toHaveLength(1);
    expect(services[0].name).toBe('service-a');
  });

  it('should detect service dependencies', async () => {
    const serviceBPath = path.join(testDir, 'service-b');
    await fs.mkdir(serviceBPath, { recursive: true });
    await fs.writeFile(
      path.join(serviceBPath, 'package.json'),
      JSON.stringify({
        name: 'service-b',
        dependencies: { '@services/service-a': '1.0.0' },
      })
    );

    const services = await detectMicroservices(testDir);
    expect(services).toHaveLength(1);
    expect(services[0].dependencies).toContain('@services/service-a');
  });
});

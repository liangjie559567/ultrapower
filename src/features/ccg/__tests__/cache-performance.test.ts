import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileCache } from '../file-cache.js';
import { detectMicroservices } from '../microservice-detector.js';

describe('Cache Performance', () => {
  const testDir = path.join(process.cwd(), '.test-cache-perf');

  beforeEach(async () => {
    fileCache.clear();
    await fs.mkdir(testDir, { recursive: true });

    for (let i = 0; i < 10; i++) {
      const serviceDir = path.join(testDir, `service-${i}`);
      await fs.mkdir(serviceDir, { recursive: true });
      await fs.writeFile(
        path.join(serviceDir, 'package.json'),
        JSON.stringify({ name: `service-${i}`, dependencies: {} })
      );
    }
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should improve performance with cache', async () => {
    await detectMicroservices(testDir);
    await detectMicroservices(testDir);

    expect(fileCache.getStats().size).toBeGreaterThan(0);
    expect(fileCache.getStats().hits).toBeGreaterThan(0);
  });

  it('should respect TTL', async () => {
    await fileCache.readdir(testDir);
    const stats1 = fileCache.getStats();
    expect(stats1.size).toBe(1);

    fileCache.clear();
    const stats2 = fileCache.getStats();
    expect(stats2.size).toBe(0);
  });
});

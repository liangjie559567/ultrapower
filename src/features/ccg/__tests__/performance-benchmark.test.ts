import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { detectProjectType } from '../project-detector.js';
import { detectMicroservices } from '../microservice-detector.js';
import { splitModificationPlan } from '../module-splitter.js';

const TEMP_DIR = join(process.cwd(), '.test-perf');

function measure(name: string, fn: () => Promise<void>) {
  return async () => {
    const start = performance.now();
    await fn();
    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  };
}

function createLargeProject(fileCount: number) {
  const dir = join(TEMP_DIR, 'large-project');
  mkdirSync(dir, { recursive: true });

  for (let i = 0; i < fileCount; i++) {
    const subDir = join(dir, `module-${Math.floor(i / 10)}`);
    mkdirSync(subDir, { recursive: true });
    writeFileSync(
      join(subDir, `file-${i}.ts`),
      `export function fn${i}() { return ${i}; }\n`
    );
  }

  writeFileSync(join(dir, 'package.json'), '{"name":"test"}');
  return dir;
}

function createMicroservices(serviceCount: number, filesPerService: number) {
  const dir = join(TEMP_DIR, 'microservices');
  mkdirSync(dir, { recursive: true });

  for (let s = 0; s < serviceCount; s++) {
    const svcDir = join(dir, `service-${s}`);
    mkdirSync(svcDir, { recursive: true });
    writeFileSync(join(svcDir, 'package.json'), `{"name":"svc-${s}"}`);

    for (let f = 0; f < filesPerService; f++) {
      writeFileSync(
        join(svcDir, `file-${f}.ts`),
        `export const data${f} = ${f};\n`
      );
    }
  }

  return dir;
}

describe('CCG Performance Benchmark', () => {
  beforeAll(() => {
    mkdirSync(TEMP_DIR, { recursive: true });
  });

  afterAll(() => {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  it('Test 1: Large project detection (100+ files)', async () => {
    const dir = createLargeProject(100);
    const duration = await measure('Large project detection', async () => {
      await detectProjectType(dir);
    })();

    expect(duration).toBeLessThan(5000);
  });

  it('Test 2: Microservice detection (5 services)', async () => {
    const dir = createMicroservices(5, 20);
    const duration = await measure('Microservice detection', async () => {
      await detectMicroservices(dir);
    })();

    expect(duration).toBeLessThan(3000);
  });

  it('Test 3: Module splitting performance', async () => {
    const dir = createLargeProject(50);
    // Create modification-plan.md for splitModificationPlan
    mkdirSync(join(dir, '.omc', 'ccg'), { recursive: true });
    writeFileSync(join(dir, '.omc', 'ccg', 'modification-plan.md'), '## Module 1\n\n## Module 2\n');
    const duration = await measure('Module splitting', async () => {
      await splitModificationPlan(dir);
    })();

    expect(duration).toBeLessThan(2000);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { ModuleLoopController } from './module-loop-controller.js';

describe('ModuleLoopController', () => {
  const testDir = path.join(process.cwd(), '.test-module-loop');
  const ccgDir = path.join(testDir, '.omc', 'ccg');
  const devModulesDir = path.join(ccgDir, 'dev-modules');

  beforeEach(async () => {
    await fs.mkdir(devModulesDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should execute single module loop', async () => {
    const modulePath = path.join(devModulesDir, 'dev-module-1.md');
    await fs.writeFile(modulePath, `# 开发模块\n\n## 依赖关系\n无\n`);

    const controller = new ModuleLoopController(testDir);
    const results = await controller.executeModules([modulePath]);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].phases.development).toBe(true);
    expect(results[0].phases.review).toBe(true);
    expect(results[0].phases.optimization).toBe(true);
    expect(results[0].phases.testing).toBe(true);
  });

  it('should handle module dependencies', async () => {
    const module1 = path.join(devModulesDir, 'dev-module-1.md');
    const module2 = path.join(devModulesDir, 'dev-module-2.md');

    await fs.writeFile(module1, `# 开发模块\n\n## 依赖关系\n无\n`);
    await fs.writeFile(module2, `# 开发模块\n\n## 依赖关系\ndev-module-1\n`);

    const controller = new ModuleLoopController(testDir);
    const results = await controller.executeModules([module1, module2]);

    expect(results).toHaveLength(2);
    expect(results[0].moduleName).toBe('dev-module-1');
    expect(results[1].moduleName).toBe('dev-module-2');
  });
});

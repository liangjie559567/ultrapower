import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OldProjectWorkflow } from './old-project-workflow.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('OldProjectWorkflow', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'old-workflow-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should execute old project workflow', async () => {
    const workflow = new OldProjectWorkflow({ workingDir: testDir });
    await workflow.execute();

    const featureFlowPath = path.join(testDir, '.omc', 'ccg', 'feature-flow.md');
    const modificationPlanPath = path.join(testDir, '.omc', 'ccg', 'modification-plan.md');
    const modulesDir = path.join(testDir, '.omc', 'ccg', 'dev-modules');

    expect(await fs.access(featureFlowPath).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(modificationPlanPath).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(modulesDir).then(() => true).catch(() => false)).toBe(true);
  });
});

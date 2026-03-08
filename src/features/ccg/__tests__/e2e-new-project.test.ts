import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NewProjectWorkflow } from '../workflows/new-project-workflow.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('E2E: New Project Workflow', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccg-e2e-new-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should complete full new project workflow', async () => {
    const workflow = new NewProjectWorkflow({
      workingDir: testDir,
      maxOptimizationRounds: 2,
      maxTestingRounds: 2,
    });

    await workflow.execute();

    const requirementsPath = path.join(testDir, '.ccg', 'docs', 'requirements.md');
    const techDesignPath = path.join(testDir, '.ccg', 'docs', 'tech-design.md');

    expect(await fs.access(requirementsPath).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(techDesignPath).then(() => true).catch(() => false)).toBe(true);
  }, 60000);

  it('should handle optimization convergence', async () => {
    const workflow = new NewProjectWorkflow({
      workingDir: testDir,
      maxOptimizationRounds: 1,
      maxTestingRounds: 1,
    });

    await expect(workflow.execute()).resolves.not.toThrow();
  }, 30000);
});

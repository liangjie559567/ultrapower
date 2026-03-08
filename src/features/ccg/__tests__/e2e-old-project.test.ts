import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OldProjectWorkflow } from '../workflows/old-project-workflow.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('E2E: Old Project Workflow', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccg-e2e-old-'));
    await fs.mkdir(path.join(testDir, '.omc', 'ccg'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, '.omc', 'ccg', 'feature-flow.md'),
      '# Existing Feature\n\n## Current Implementation\nLegacy code'
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should complete full old project workflow', async () => {
    const workflow = new OldProjectWorkflow({ workingDir: testDir });

    await workflow.execute();

    const modPlanPath = path.join(testDir, '.omc', 'ccg', 'modification-plan.md');
    expect(await fs.access(modPlanPath).then(() => true).catch(() => false)).toBe(true);
  }, 60000);

  it('should handle module splitting', async () => {
    const workflow = new OldProjectWorkflow({ workingDir: testDir });

    await expect(workflow.execute()).resolves.not.toThrow();
  }, 30000);
});

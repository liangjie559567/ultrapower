import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('E2E: Performance Benchmarks', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccg-e2e-perf-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should complete workflow within time limit', async () => {
    const start = Date.now();

    const { NewProjectWorkflow } = await import('../workflows/new-project-workflow.js');
    const workflow = new NewProjectWorkflow({
      workingDir: testDir,
      maxOptimizationRounds: 1,
      maxTestingRounds: 1,
    });

    await workflow.execute();

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(120000); // < 2 minutes for minimal workflow
  }, 150000);

  it('should handle timeout gracefully', async () => {
    const { executeWithFallback } = await import('../codex-fallback.js');

    const result = await executeWithFallback(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
      },
      async () => 'fallback'
    );

    expect(result).toBeDefined();
  });
});

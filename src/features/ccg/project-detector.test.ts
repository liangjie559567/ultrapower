import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { detectProjectType, clearCache } from './project-detector';

describe('project-detector', () => {
  const testDir = path.join(__dirname, '__test_project_detector__');

  beforeEach(async () => {
    clearCache();
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should detect old project when feature-flow.md exists', async () => {
    const featureFlowPath = path.join(testDir, 'feature-flow.md');
    await fs.writeFile(featureFlowPath, '# Feature Flow');

    const result = await detectProjectType(testDir);

    expect(result.type).toBe('old');
    expect(result.confidence).toBe(1.0);
    expect(result.reason).toBe('feature-flow.md exists');
  });

  it('should detect new project when feature-flow.md does not exist', async () => {
    const result = await detectProjectType(testDir);

    expect(result.type).toBe('new');
    expect(result.confidence).toBe(1.0);
    expect(result.reason).toBe('feature-flow.md not found');
  });

  it('should respect manual type specification', async () => {
    const result = await detectProjectType(testDir, 'old');

    expect(result.type).toBe('old');
    expect(result.confidence).toBe(1.0);
    expect(result.reason).toBe('Manually specified by user');
  });
});

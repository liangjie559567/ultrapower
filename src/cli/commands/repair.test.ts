import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { createRepairCommand } from './repair.js';

describe('repair command', () => {
  const testRoot = join(process.cwd(), '.test-repair');
  const stateDir = join(testRoot, '.omc', 'state');

  beforeEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
    mkdirSync(stateDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  it('should create repair command', () => {
    const cmd = createRepairCommand();
    expect(cmd.name()).toBe('repair');
  });

  it('should have required options', () => {
    const cmd = createRepairCommand();
    const options = cmd.options.map(o => o.long);

    expect(options).toContain('--fix-state-pollution');
    expect(options).toContain('--fix-orphan-agents');
    expect(options).toContain('--validate-state');
    expect(options).toContain('--dry-run');
  });

  it('should validate state files', async () => {
    writeFileSync(join(stateDir, 'test-state.json'), '{"active": true}');
    writeFileSync(join(stateDir, 'invalid-state.json'), '{invalid json}');

    const cmd = createRepairCommand();

    // Mock console to capture output
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await cmd.parseAsync(['node', 'test', '--validate-state', '-d', testRoot]);

    logSpy.mockRestore();
  });
});

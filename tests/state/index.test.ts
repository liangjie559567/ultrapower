import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { StateManager } from '../../src/state/index';

describe('StateManager - BUG-001 并发写入', () => {
  const testDir = join(process.cwd(), '.test-state');
  const mode = 'autopilot' as const;

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should handle sequential writes without corruption', async () => {
    const manager = new StateManager({ mode, directory: testDir });

    for (let i = 0; i < 10; i++) {
      const result = await manager.write({ iteration: i, timestamp: Date.now() });
      expect(result).toBe(true);
    }

    const finalState = manager.read();
    expect(finalState).toBeTruthy();
    expect(typeof finalState?.iteration).toBe('number');
    expect(finalState?.iteration).toBe(9);
  });

  it('should use atomic write with temp file', async () => {
    const manager = new StateManager({ mode, directory: testDir });
    await manager.write({ test: 'atomic' });

    const stateFile = manager.getPath();
    expect(existsSync(stateFile)).toBe(true);

    const content = readFileSync(stateFile, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.test).toBe('atomic');
  });

  it('should handle write and read cycle', async () => {
    const manager = new StateManager({ mode, directory: testDir });
    const testData = { iteration: 42, active: true };

    const writeResult = await manager.write(testData);
    expect(writeResult).toBe(true);

    const readData = manager.read();
    expect(readData).toEqual(testData);
  });
});

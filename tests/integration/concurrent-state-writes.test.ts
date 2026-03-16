import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createStateManager } from '../../src/state/index';

describe('BUG-001 并发状态写入集成测试', () => {
  const testDirs: string[] = [];

  afterEach(async () => {
    for (const dir of testDirs) {
      if (existsSync(dir)) {
        // Wait for any pending file operations to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      }
    }
    testDirs.length = 0;
  });
  it.skipIf(process.platform === 'win32')('should handle 1000+ concurrent writes without corruption', async () => {
    const testDir = join(process.cwd(), '.test-concurrent-' + Date.now());
    testDirs.push(testDir);
    const manager = createStateManager({ mode: 'autopilot', directory: testDir });
    const writes = 1000;

    await Promise.all(
      Array.from({ length: writes }, (_, i) =>
        manager.write({ active: true, iteration: i, timestamp: Date.now() })
      )
    );

    const statePath = join(testDir, '.omc', 'state', 'autopilot-state.json');
    expect(existsSync(statePath)).toBe(true);

    const content = readFileSync(statePath, 'utf-8');
    const state = JSON.parse(content);
    expect(state.active).toBe(true);
    expect(typeof state.iteration).toBe('number');
  });

  it.skipIf(process.platform === 'win32')('should preserve data integrity under concurrent load', async () => {
    const testDir = join(process.cwd(), '.test-concurrent-' + Date.now());
    testDirs.push(testDir);
    const manager = createStateManager({ mode: 'ralph', directory: testDir });

    await Promise.all(
      Array.from({ length: 500 }, (_, i) =>
        manager.write({ iteration: i, data: `test-${i}` })
      )
    );

    const state = await manager.read();
    expect(state).toBeDefined();
    expect(typeof state.iteration).toBe('number');
  });
});

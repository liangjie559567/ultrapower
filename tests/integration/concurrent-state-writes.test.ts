import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createStateManager } from '../../src/state/index';

describe('BUG-001 并发状态写入集成测试', () => {
  it.skipIf(process.platform === 'win32')('should handle 1000+ concurrent writes without corruption', async () => {
    const testDir = join(process.cwd(), '.test-concurrent-' + Date.now());
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

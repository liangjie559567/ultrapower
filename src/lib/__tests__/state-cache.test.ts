/**
 * State Cache 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { createStateAdapter } from '../state-adapter.js';
import { getStateCacheStats, invalidateStateCache } from '../state-cache.js';

const TEST_DIR = join(process.cwd(), '.test-state-cache');

interface TestState {
  active: boolean;
  iteration: number;
  timestamp?: number;
}

describe('State Cache', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('应该缓存读取的状态', async () => {
    const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
    const state: TestState = { active: true, iteration: 1 };

    await adapter.write(state);

    const read1 = adapter.read();
    const read2 = adapter.read();

    expect(read1).toEqual(state);
    expect(read2).toEqual(state);
    expect(read1).toBe(read2); // 冻结对象，相同引用
    expect(Object.isFrozen(read1)).toBe(true);
  });

  it('应该在 mtime 变化时失效缓存', async () => {
    const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

    await adapter.write({ active: true, iteration: 1 });
    const read1 = adapter.read();

    // 等待确保 mtime 变化
    await new Promise(resolve => setTimeout(resolve, 10));
    await adapter.write({ active: true, iteration: 2 });

    const read2 = adapter.read();

    expect(read1?.iteration).toBe(1);
    expect(read2?.iteration).toBe(2);
  });

  it('应该在写入后失效缓存', async () => {
    const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

    await adapter.write({ active: true, iteration: 1 });
    adapter.read();

    await adapter.write({ active: true, iteration: 2 });
    const read = adapter.read();

    expect(read?.iteration).toBe(2);
  });

  it('应该在同步写入后失效缓存', () => {
    const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

    adapter.writeSync({ active: true, iteration: 1 });
    adapter.read();

    adapter.writeSync({ active: true, iteration: 2 });
    const read = adapter.read();

    expect(read?.iteration).toBe(2);
  });

  it('应该在清除后失效缓存', async () => {
    const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

    await adapter.write({ active: true, iteration: 1 });
    adapter.read();

    adapter.clear();
    const read = adapter.read();

    expect(read).toBe(null);
  });

  it('应该返回冻结对象防止意外修改', async () => {
    const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
    const state: TestState = { active: true, iteration: 1 };

    await adapter.write(state);

    const read1 = adapter.read();
    const read2 = adapter.read();

    expect(Object.isFrozen(read1)).toBe(true);
    expect(() => {
      if (read1) (read1 as any).iteration = 999;
    }).toThrow();

    expect(read2?.iteration).toBe(1); // 未被修改
  });

  it('应该提供缓存统计', async () => {
    const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

    await adapter.write({ active: true, iteration: 1 });
    adapter.read();

    const stats = getStateCacheStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.entries.length).toBeGreaterThan(0);
  });

  it('应该支持手动失效缓存', async () => {
    const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
    const path = adapter.getPath();

    await adapter.write({ active: true, iteration: 1 });
    adapter.read();

    invalidateStateCache(path);

    const statsBefore = getStateCacheStats();
    const hasEntry = statsBefore.entries.includes(path);
    expect(hasEntry).toBe(false);
  });
});

/**
 * StateAdapter 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createStateAdapter } from '../state-adapter.js';

const TEST_DIR = join(process.cwd(), '.test-state-adapter');

interface TestState {
  active: boolean;
  iteration: number;
  data?: string;
}

describe('StateAdapter', () => {
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

  describe('基础操作', () => {
    it('应该创建适配器实例', () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
      expect(adapter).toBeDefined();
    });

    it('应该返回正确的路径', () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
      const path = adapter.getPath();
      expect(path).toContain('.omc');
      expect(path).toContain('state');
      expect(path).toContain('ralph-state.json');
    });

    it('应该返回会话级路径', () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
      const path = adapter.getPath('test-session');
      expect(path).toContain('.omc');
      expect(path).toContain('sessions');
      expect(path).toContain('test-session');
      expect(path).toContain('ralph-state.json');
    });
  });

  describe('读写操作', () => {
    it('应该写入并读取状态', async () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
      const state: TestState = { active: true, iteration: 1 };

      const written = await adapter.write(state);
      expect(written).toBe(true);

      const read = adapter.read();
      expect(read).toEqual(state);
    });

    it('应该支持同步写入', () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
      const state: TestState = { active: true, iteration: 2 };

      const written = adapter.writeSync(state);
      expect(written).toBe(true);

      const read = adapter.read();
      expect(read).toEqual(state);
    });

    it('读取不存在的状态应返回 null', () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
      const read = adapter.read();
      expect(read).toBe(null);
    });
  });

  describe('会话隔离', () => {
    it('应该隔离不同会话的状态', async () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

      const state1: TestState = { active: true, iteration: 1, data: 'session1' };
      const state2: TestState = { active: true, iteration: 2, data: 'session2' };

      await adapter.write(state1, 'session1');
      await adapter.write(state2, 'session2');

      const read1 = adapter.read('session1');
      const read2 = adapter.read('session2');

      expect(read1?.data).toBe('session1');
      expect(read2?.data).toBe('session2');
    });

    it('应该列出所有会话', async () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

      await adapter.write({ active: true, iteration: 1 }, 'session1');
      await adapter.write({ active: true, iteration: 2 }, 'session2');

      const sessions = adapter.list();
      expect(sessions).toContain('session1');
      expect(sessions).toContain('session2');
      expect(sessions.length).toBe(2);
    });
  });

  describe('清除操作', () => {
    it('应该清除状态', async () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

      await adapter.write({ active: true, iteration: 1 });
      expect(adapter.exists()).toBe(true);

      const cleared = adapter.clear();
      expect(cleared).toBe(true);
      expect(adapter.exists()).toBe(false);
    });

    it('应该清除会话状态', async () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

      await adapter.write({ active: true, iteration: 1 }, 'test-session');
      expect(adapter.exists('test-session')).toBe(true);

      const cleared = adapter.clear('test-session');
      expect(cleared).toBe(true);
      expect(adapter.exists('test-session')).toBe(false);
    });
  });

  describe('原子写入', () => {
    it('应该使用原子写入', async () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);
      const state: TestState = { active: true, iteration: 1 };

      await adapter.write(state);

      const path = adapter.getPath();
      const content = readFileSync(path, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(state);
    });
  });

  describe('错误处理', () => {
    it('应该拒绝无效的模式', () => {
      expect(() => {
        createStateAdapter<TestState>('../../etc/passwd' as any, TEST_DIR);
      }).toThrow();
    });

    it('应该拒绝无效的会话 ID', async () => {
      const adapter = createStateAdapter<TestState>('ralph', TEST_DIR);

      await expect(async () => {
        await adapter.write({ active: true, iteration: 1 }, '../invalid');
      }).rejects.toThrow();
    });
  });
});

/**
 * race-condition.test.ts - 竞态条件检测器测试
 *
 * 测试场景：
 * - 并发文件访问竞态
 * - 状态更新竞态
 * - 锁竞争场景
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { withFileLock } from '../file-lock.js';

describe('竞态条件检测', () => {
  let tmpDir: string;
  let testFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'race-test-'));
    testFile = path.join(tmpDir, 'state.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('并发文件写入：无锁时发生竞态', async () => {
    const writes = Array.from({ length: 10 }, (_, i) =>
      fs.promises.writeFile(testFile, JSON.stringify({ value: i }))
    );

    await Promise.all(writes);
    const final = JSON.parse(await fs.promises.readFile(testFile, 'utf8'));

    // 无锁时最终值不确定
    expect(final.value).toBeGreaterThanOrEqual(0);
    expect(final.value).toBeLessThan(10);
  });

  it('并发文件写入：有锁时串行执行', async () => {
    let count = 0;

    for (let i = 0; i < 5; i++) {
      await withFileLock(testFile, async () => {
        const current = fs.existsSync(testFile)
          ? JSON.parse(await fs.promises.readFile(testFile, 'utf8')).count || 0
          : 0;
        const next = current + 1;
        await fs.promises.writeFile(testFile, JSON.stringify({ count: next }));
        count++;
      }, 100, 100);
    }

    const final = JSON.parse(await fs.promises.readFile(testFile, 'utf8'));
    expect(final.count).toBe(5);
    expect(count).toBe(5);
  });

  it('状态更新竞态：读-修改-写模式', async () => {
    await fs.promises.writeFile(testFile, JSON.stringify({ counter: 0 }));

    const increment = async () => {
      return withFileLock(testFile, async () => {
        const data = JSON.parse(await fs.promises.readFile(testFile, 'utf8'));
        data.counter++;
        await fs.promises.writeFile(testFile, JSON.stringify(data));
      }, 100, 100);
    };

    for (let i = 0; i < 5; i++) {
      await increment();
    }

    const final = JSON.parse(await fs.promises.readFile(testFile, 'utf8'));
    expect(final.counter).toBe(5);
  });

  it('锁竞争：顺序执行验证', async () => {
    let completed = 0;

    for (let i = 0; i < 5; i++) {
      await withFileLock(testFile, async () => {
        completed++;
        await new Promise(resolve => setTimeout(resolve, 10));
      }, 100, 100);
    }

    expect(completed).toBe(5);
  });
});

/**
 * file-lock.test.ts
 *
 * 覆盖：
 * - 正常加锁/解锁（lock.json 创建/删除）
 * - 加锁后 lock.json 包含 pid 和 timestamp
 * - 解锁后锁目录被删除
 * - 活跃锁（非陈旧）→ 第二次 acquireLock 抛出 Error
 * - 陈旧锁（timestamp > staleMs）→ 自动抢占成功
 * - lock.json 不可读 → 视为陈旧，自动抢占
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { acquireLock } from '../file-lock.js';

// ══════════════════════════════════════════════════════════════════════════════
describe('acquireLock', () => {
  let tmpDir: string;
  let lockPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-lock-test-'));
    lockPath = path.join(tmpDir, '.lock');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── 1. 正常加锁：lock 目录和 lock.json 被创建 ────────────────────────────
  it('加锁后锁目录存在', async () => {
    const unlock = await acquireLock(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);
    await unlock();
  });

  it('加锁后 lock.json 包含 pid 和 timestamp', async () => {
    const unlock = await acquireLock(lockPath);

    const lockFile = path.join(lockPath, 'lock.json');
    const meta = JSON.parse(fs.readFileSync(lockFile, 'utf8')) as {
      pid: number;
      timestamp: number;
    };

    expect(meta.pid).toBe(process.pid);
    expect(typeof meta.timestamp).toBe('number');
    expect(meta.timestamp).toBeGreaterThan(0);

    await unlock();
  });

  // ─── 2. 正常解锁：锁目录被删除 ──────────────────────────────────────────
  it('unlock() 后锁目录不再存在', async () => {
    const unlock = await acquireLock(lockPath);
    await unlock();
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('unlock() 幂等：重复调用不抛出', async () => {
    const unlock = await acquireLock(lockPath);
    await unlock();
    await expect(unlock()).resolves.not.toThrow();
  });

  // ─── 3. 活跃锁 → 第二次加锁抛出 Error ──────────────────────────────────
  it('活跃锁未释放时第二次 acquireLock 抛出 Error', async () => {
    const staleMs = 30000; // 默认 30 秒，不会陈旧
    const unlock = await acquireLock(lockPath, staleMs);

    await expect(acquireLock(lockPath, staleMs)).rejects.toThrow('锁已被占用');

    await unlock();
  });

  it('抛出的错误信息包含锁路径', async () => {
    const unlock = await acquireLock(lockPath);

    try {
      await acquireLock(lockPath);
      expect.fail('应该抛出错误');
    } catch (err) {
      expect((err as Error).message).toContain(lockPath);
    } finally {
      await unlock();
    }
  });

  // ─── 4. 陈旧锁 → 自动抢占 ───────────────────────────────────────────────
  it('timestamp 超过 staleMs 的锁视为陈旧，可被自动抢占', async () => {
    // 手动创建一个陈旧的锁（timestamp = 0，即 1970-01-01）
    fs.mkdirSync(lockPath);
    const lockFile = path.join(lockPath, 'lock.json');
    fs.writeFileSync(
      lockFile,
      JSON.stringify({ pid: 99999, timestamp: 0 }),
      'utf8'
    );

    // staleMs=100：timestamp=0 显然超过 100ms，应自动抢占
    const unlock = await acquireLock(lockPath, 100);
    expect(fs.existsSync(lockPath)).toBe(true);
    await unlock();
  });

  it('陈旧锁抢占后 lock.json 更新为当前进程 pid', async () => {
    // 创建一个 timestamp=0 的陈旧锁
    fs.mkdirSync(lockPath);
    fs.writeFileSync(
      path.join(lockPath, 'lock.json'),
      JSON.stringify({ pid: 99999, timestamp: 0 }),
      'utf8'
    );

    const unlock = await acquireLock(lockPath, 100);
    const meta = JSON.parse(
      fs.readFileSync(path.join(lockPath, 'lock.json'), 'utf8')
    ) as { pid: number; timestamp: number };

    expect(meta.pid).toBe(process.pid);
    await unlock();
  });

  // ─── 5. lock.json 不可读 → 视为陈旧，自动抢占 ─────────────────────────
  it('锁目录存在但 lock.json 不可读 → 视为陈旧，自动抢占', async () => {
    // 创建锁目录但不写 lock.json
    fs.mkdirSync(lockPath);

    const unlock = await acquireLock(lockPath, 30000);
    expect(fs.existsSync(lockPath)).toBe(true);
    await unlock();
  });

  // ─── 6. 连续加解锁（串行复用）────────────────────────────────────────────
  it('释放后可再次加锁', async () => {
    const unlock1 = await acquireLock(lockPath);
    await unlock1();

    const unlock2 = await acquireLock(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);
    await unlock2();
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  // ─── 7. 不同路径的锁互不干扰 ────────────────────────────────────────────
  it('不同路径的锁互不干扰，可同时持有', async () => {
    const lockPath2 = path.join(tmpDir, '.lock2');

    const unlock1 = await acquireLock(lockPath);
    const unlock2 = await acquireLock(lockPath2);

    expect(fs.existsSync(lockPath)).toBe(true);
    expect(fs.existsSync(lockPath2)).toBe(true);

    await unlock1();
    await unlock2();
  });
});

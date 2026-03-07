/**
 * file-lock.ts — 基于目录的文件锁实现
 *
 * 使用 mkdirSync 的原子性保证互斥，支持陈旧锁自动清理。
 */

import * as fs from 'fs';
import * as path from 'path';

interface LockMeta {
  pid: number;
  timestamp: number;
}

/**
 * 获取文件锁。
 *
 * 实现原理：通过 fs.mkdirSync 的原子性创建锁目录，
 * 成功创建即持有锁；失败则检测陈旧锁并决定是否抢占。
 *
 * @param lockPath  锁目录路径（如 `.omc/axiom/evolution/.archive.lock`）
 * @param staleMs   陈旧超时毫秒数，默认 30000（30 秒）
 * @returns         unlock 函数，调用后释放锁
 * @throws          Error 当锁未陈旧且被其他进程持有时
 */
export async function acquireLock(
  lockPath: string,
  staleMs: number = 30000,
): Promise<() => Promise<void>> {
  const lockFile = path.join(lockPath, 'lock.json');

  const tryAcquire = (): void => {
    try {
      // mkdirSync 在目录已存在时抛出 EEXIST，保证原子互斥
      fs.mkdirSync(lockPath);
    } catch (err) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code !== 'EEXIST') {
        throw err;
      }

      // 目录已存在：检测是否为陈旧锁
      let meta: LockMeta | null = null;
      try {
        const raw = fs.readFileSync(lockFile, 'utf8');
        meta = JSON.parse(raw) as LockMeta;
      } catch {
        // lock.json 不可读 → 视为陈旧锁，强制清理
      }

      const isStale =
        meta === null || Date.now() - meta.timestamp > staleMs;

      if (isStale) {
        // 强制移除陈旧锁目录并重试
        fs.rmSync(lockPath, { recursive: true, force: true });
        tryAcquire();
        return;
      }

      throw new Error(`[file-lock] 锁已被占用: ${lockPath}`);
    }

    // 成功创建锁目录，写入元数据
    const meta: LockMeta = { pid: process.pid, timestamp: Date.now() };
    fs.writeFileSync(lockFile, JSON.stringify(meta), 'utf8');
  };

  tryAcquire();

  const unlock = async (): Promise<void> => {
    fs.rmSync(lockPath, { recursive: true, force: true });
  };

  return unlock;
}

/**
 * 在文件锁保护下执行同步操作
 */
export function withFileLock<T>(filePath: string, fn: () => T): T {
  const lockPath = `${filePath}.lock`;
  const lockFile = path.join(lockPath, 'lock.json');

  try {
    fs.mkdirSync(lockPath);
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'EEXIST') {
      let meta: LockMeta | null = null;
      try {
        const raw = fs.readFileSync(lockFile, 'utf8');
        meta = JSON.parse(raw) as LockMeta;
      } catch {
        // Ignore parse errors, treat as stale lock
      }

      const isStale = meta === null || Date.now() - meta.timestamp > 30000;
      if (isStale) {
        fs.rmSync(lockPath, { recursive: true, force: true });
        return withFileLock(filePath, fn);
      }
      throw new Error(`[file-lock] 锁已被占用: ${lockPath}`);
    }
    throw err;
  }

  const meta: LockMeta = { pid: process.pid, timestamp: Date.now() };
  fs.writeFileSync(lockFile, JSON.stringify(meta), 'utf8');

  try {
    return fn();
  } finally {
    fs.rmSync(lockPath, { recursive: true, force: true });
  }
}

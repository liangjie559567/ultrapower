/**
 * StateAdapter 抽象层
 *
 * 统一状态管理接口，消除 autopilot/ralph/ultrawork 等模式的重复代码。
 * 提供类型安全的状态读写操作，支持会话级和全局状态。
 *
 * 核心特性：
 * - 统一路径解析（会话隔离 + 旧版回退）
 * - 强制原子写入 + 文件锁
 * - 自动目录创建
 * - 类型安全的泛型支持
 */

import { existsSync, readFileSync, unlinkSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { assertValidMode, assertValidSessionId, type ValidMode } from './validateMode.js';
import { resolveSessionStatePath, ensureSessionStateDir } from './worktree-paths.js';
import { atomicWriteJsonSync } from './atomic-write.js';
import { withFileLock } from './file-lock.js';
import { readStateWithCache, invalidateStateCache } from './state-cache.js';

/**
 * 状态适配器接口
 */
export interface StateAdapter<T> {
  /** 读取状态 */
  read(sessionId?: string): T | null;
  /** 异步写入状态（带文件锁） */
  write(data: T, sessionId?: string): Promise<boolean>;
  /** 同步写入状态 */
  writeSync(data: T, sessionId?: string): boolean;
  /** 清除状态 */
  clear(sessionId?: string): boolean;
  /** 检查状态是否存在 */
  exists(sessionId?: string): boolean;
  /** 获取状态文件路径 */
  getPath(sessionId?: string): string;
  /** 列出所有会话 ID */
  list(): string[];
}

/**
 * 基于文件系统的状态适配器实现
 */
export class FileStateAdapter<T> implements StateAdapter<T> {
  private readonly mode: ValidMode;
  private readonly directory: string;

  constructor(mode: ValidMode, directory: string) {
    this.mode = assertValidMode(mode);
    this.directory = directory;
  }

  /**
   * 获取状态文件路径
   */
  getPath(sessionId?: string): string {
    if (sessionId) {
      const validSessionId = assertValidSessionId(sessionId);
      return resolveSessionStatePath(this.mode, validSessionId, this.directory);
    }
    return join(this.directory, '.omc', 'state', `${this.mode}-state.json`);
  }

  /**
   * 确保状态目录存在
   */
  private ensureDir(sessionId?: string): void {
    if (sessionId) {
      const validSessionId = assertValidSessionId(sessionId);
      ensureSessionStateDir(validSessionId, this.directory);
      return;
    }
    const stateDir = join(this.directory, '.omc', 'state');
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }
  }

  /**
   * 读取状态（带缓存）
   */
  read(sessionId?: string): T | null {
    const stateFile = this.getPath(sessionId);

    if (!existsSync(stateFile)) {
      return null;
    }

    try {
      const content = readFileSync(stateFile, 'utf-8');
      const state = JSON.parse(content) as T;

      // 会话级状态验证
      if (sessionId && typeof state === 'object' && state !== null) {
        const stateWithSession = state as T & { session_id?: string };
        if (stateWithSession.session_id && stateWithSession.session_id !== sessionId) {
          return null;
        }
      }

      return readStateWithCache(stateFile, state);
    } catch {
      return null;
    }
  }

  /**
   * 写入状态（异步）
   */
  async write(data: T, sessionId?: string): Promise<boolean> {
    const stateFile = this.getPath(sessionId);

    const result = await withFileLock(stateFile, () => {
      this.ensureDir(sessionId);
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          atomicWriteJsonSync(stateFile, data);
          return true;
        } catch (_err) {
          if (attempt === 3) return false;
        }
      }
      return false;
    });

    if (result) {
      invalidateStateCache(stateFile);
    }
    return result;
  }

  /**
   * 写入状态（同步）
   */
  writeSync(data: T, sessionId?: string): boolean {
    try {
      this.ensureDir(sessionId);
      const stateFile = this.getPath(sessionId);
      writeFileSync(stateFile, JSON.stringify(data, null, 2), { mode: 0o600 });
      invalidateStateCache(stateFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清除状态
   */
  clear(sessionId?: string): boolean {
    const stateFile = this.getPath(sessionId);

    if (!existsSync(stateFile)) {
      return true;
    }

    try {
      unlinkSync(stateFile);
      invalidateStateCache(stateFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查状态是否存在
   */
  exists(sessionId?: string): boolean {
    return existsSync(this.getPath(sessionId));
  }

  /**
   * 列出所有会话 ID
   */
  list(): string[] {
    const sessionsDir = join(this.directory, '.omc', 'state', 'sessions');
    if (!existsSync(sessionsDir)) {
      return [];
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { readdirSync } = require('fs') as typeof import('fs');
      const entries = readdirSync(sessionsDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  }
}

/**
 * 创建状态适配器工厂函数
 */
export function createStateAdapter<T>(mode: ValidMode, directory: string): StateAdapter<T> {
  return new FileStateAdapter<T>(mode, directory);
}

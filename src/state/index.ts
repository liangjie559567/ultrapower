/**
 * 统一状态管理层 - StateManager
 *
 * 提供统一接口，支持文件系统和 SQLite 后端，支持双写模式渐进迁移
 */

import { FileStateAdapter, type StateAdapter } from '../lib/state-adapter.js';
import type { ValidMode } from '../lib/validateMode.js';

export interface StateManagerOptions {
  mode: ValidMode;
  directory: string;
  sessionId?: string;
  backend?: 'file' | 'sqlite';
  dualWrite?: boolean; // 双写模式：同时写入旧版和新版
}

export class StateManager<T = Record<string, unknown>> {
  private adapter: StateAdapter<T>;
  private options: StateManagerOptions;
  private defaultSessionId?: string;

  constructor(options: StateManagerOptions) {
    this.options = options;
    this.defaultSessionId = options.sessionId;
    // 当前仅支持文件后端，SQLite 后端预留
    this.adapter = new FileStateAdapter<T>(options.mode, options.directory);
  }

  read(sessionId?: string): T | null {
    return this.adapter.read(sessionId || this.defaultSessionId);
  }

  async write(data: T, sessionId?: string): Promise<boolean> {
    return this.adapter.write(data, sessionId || this.defaultSessionId);
  }

  writeSync(data: T, sessionId?: string): boolean {
    return this.adapter.writeSync(data, sessionId || this.defaultSessionId);
  }

  clear(sessionId?: string): boolean {
    return this.adapter.clear(sessionId || this.defaultSessionId);
  }

  exists(sessionId?: string): boolean {
    return this.adapter.exists(sessionId || this.defaultSessionId);
  }

  getPath(sessionId?: string): string {
    return this.adapter.getPath(sessionId || this.defaultSessionId);
  }

  list(): string[] {
    return this.adapter.list();
  }
}

export function createStateManager<T = Record<string, unknown>>(
  options: StateManagerOptions
): StateManager<T> {
  return new StateManager<T>(options);
}

/**
 * 统一状态管理层 - StateManager
 *
 * 提供统一接口，支持文件系统和 SQLite 后端，支持双写模式渐进迁移
 */
import type { ValidMode } from '../lib/validateMode.js';
export interface StateManagerOptions {
    mode: ValidMode;
    directory: string;
    backend?: 'file' | 'sqlite';
    dualWrite?: boolean;
}
export declare class StateManager<T = Record<string, unknown>> {
    private adapter;
    private options;
    constructor(options: StateManagerOptions);
    read(sessionId?: string): T | null;
    write(data: T, sessionId?: string): Promise<boolean>;
    writeSync(data: T, sessionId?: string): boolean;
    clear(sessionId?: string): boolean;
    exists(sessionId?: string): boolean;
    getPath(sessionId?: string): string;
    list(): string[];
}
export declare function createStateManager<T = Record<string, unknown>>(options: StateManagerOptions): StateManager<T>;
//# sourceMappingURL=index.d.ts.map
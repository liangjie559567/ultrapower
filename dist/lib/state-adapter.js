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
import { existsSync, readFileSync, unlinkSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { assertValidMode, assertValidSessionId } from './validateMode.js';
import { resolveSessionStatePath, ensureSessionStateDir } from './worktree-paths.js';
import { atomicWriteJsonSync } from './atomic-write.js';
import { withFileLock, withFileLockSync } from './file-lock.js';
import { readStateWithCache, invalidateStateCache } from './state-cache.js';
/**
 * 基于文件系统的状态适配器实现
 */
export class FileStateAdapter {
    mode;
    directory;
    noLegacyFallback;
    constructor(mode, directory, noLegacyFallback = false) {
        this.mode = assertValidMode(mode);
        this.directory = resolve(directory);
        this.noLegacyFallback = noLegacyFallback;
    }
    /**
     * 获取状态文件路径
     */
    getPath(sessionId) {
        if (sessionId) {
            const validSessionId = assertValidSessionId(sessionId);
            return resolveSessionStatePath(this.mode, validSessionId, this.directory);
        }
        return join(this.directory, '.omc', 'state', `${this.mode}-state.json`);
    }
    /**
     * 确保状态目录存在
     */
    ensureDir(sessionId) {
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
    read(sessionId) {
        const stateFile = this.getPath(sessionId);
        if (!existsSync(stateFile)) {
            // Fallback: if session-specific file doesn't exist, try legacy path (unless disabled)
            if (sessionId && !this.noLegacyFallback) {
                const legacyPath = this.getPath();
                if (existsSync(legacyPath)) {
                    return this.read(); // Read from legacy path
                }
            }
            return null;
        }
        try {
            const content = readFileSync(stateFile, 'utf-8');
            const state = JSON.parse(content);
            // 会话级状态验证
            if (sessionId && typeof state === 'object' && state !== null) {
                const stateWithSession = state;
                if (stateWithSession.session_id && stateWithSession.session_id !== sessionId) {
                    return null;
                }
            }
            return readStateWithCache(stateFile, state);
        }
        catch (err) {
            console.debug('[state-adapter] Read failed:', err);
            return null;
        }
    }
    /**
     * 写入状态（异步）
     */
    async write(data, sessionId) {
        const stateFile = this.getPath(sessionId);
        const result = await withFileLock(stateFile, () => {
            this.ensureDir(sessionId);
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    atomicWriteJsonSync(stateFile, data);
                    return true;
                }
                catch (err) {
                    console.debug('[state-adapter] Write attempt failed:', err);
                    if (attempt === 3)
                        return false;
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
    writeSync(data, sessionId) {
        const stateFile = this.getPath(sessionId);
        try {
            const result = withFileLockSync(stateFile, () => {
                this.ensureDir(sessionId);
                atomicWriteJsonSync(stateFile, data);
                return true;
            });
            if (result) {
                invalidateStateCache(stateFile);
            }
            return result;
        }
        catch (err) {
            console.debug('[state-adapter] Sync write failed:', err);
            return false;
        }
    }
    /**
     * 清除状态
     */
    clear(sessionId) {
        const stateFile = this.getPath(sessionId);
        if (!existsSync(stateFile)) {
            return true;
        }
        try {
            unlinkSync(stateFile);
            invalidateStateCache(stateFile);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 检查状态是否存在
     */
    exists(sessionId) {
        return existsSync(this.getPath(sessionId));
    }
    /**
     * 列出所有会话 ID
     */
    list() {
        const sessionsDir = join(this.directory, '.omc', 'state', 'sessions');
        if (!existsSync(sessionsDir)) {
            return [];
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { readdirSync } = require('fs');
            const entries = readdirSync(sessionsDir, { withFileTypes: true });
            return entries
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name);
        }
        catch {
            return [];
        }
    }
}
/**
 * 创建状态适配器工厂函数
 */
export function createStateAdapter(mode, directory, noLegacyFallback = false) {
    return new FileStateAdapter(mode, directory, noLegacyFallback);
}
//# sourceMappingURL=state-adapter.js.map
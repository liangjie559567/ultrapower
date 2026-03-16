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
import { type ValidMode } from './validateMode.js';
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
export declare class FileStateAdapter<T> implements StateAdapter<T> {
    private readonly mode;
    private readonly directory;
    private readonly noLegacyFallback;
    constructor(mode: ValidMode, directory: string, noLegacyFallback?: boolean);
    /**
     * 获取状态文件路径
     */
    getPath(sessionId?: string): string;
    /**
     * 确保状态目录存在
     */
    private ensureDir;
    /**
     * 读取状态（带缓存）
     */
    read(sessionId?: string): T | null;
    /**
     * 写入状态（异步）
     */
    write(data: T, sessionId?: string): Promise<boolean>;
    /**
     * 写入状态（同步）
     */
    writeSync(data: T, sessionId?: string): boolean;
    /**
     * 清除状态
     */
    clear(sessionId?: string): boolean;
    /**
     * 检查状态是否存在
     */
    exists(sessionId?: string): boolean;
    /**
     * 列出所有会话 ID
     */
    list(): string[];
}
/**
 * 创建状态适配器工厂函数
 */
export declare function createStateAdapter<T>(mode: ValidMode, directory: string, noLegacyFallback?: boolean): StateAdapter<T>;
//# sourceMappingURL=state-adapter.d.ts.map
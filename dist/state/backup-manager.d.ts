/**
 * 灾难恢复机制 - BackupManager
 *
 * 提供定期自动备份和 restore 命令
 */
import type { ValidMode } from '../lib/validateMode.js';
export interface BackupOptions {
    directory: string;
    maxBackups?: number;
    backupInterval?: number;
}
export declare class BackupManager {
    private directory;
    private maxBackups;
    private backupInterval;
    private backupTimer?;
    constructor(options: BackupOptions);
    /**
     * 获取备份目录路径
     */
    private getBackupDir;
    /**
     * 确保备份目录存在
     */
    private ensureBackupDir;
    /**
     * 获取状态文件路径
     */
    private getStatePath;
    /**
     * 创建备份
     */
    backup(mode: ValidMode, sessionId?: string): boolean;
    /**
     * 恢复备份
     */
    restore(mode: ValidMode, timestamp?: string, sessionId?: string): boolean;
    /**
     * 清理旧备份
     */
    private cleanOldBackups;
    /**
     * 列出所有备份
     */
    listBackups(mode?: ValidMode, sessionId?: string): string[];
    /**
     * 启动自动备份
     */
    startAutoBackup(modes: ValidMode[]): void;
    /**
     * 停止自动备份
     */
    stopAutoBackup(): void;
}
export declare function createBackupManager(options: BackupOptions): BackupManager;
//# sourceMappingURL=backup-manager.d.ts.map
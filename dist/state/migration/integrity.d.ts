/**
 * 状态迁移完整性保障
 */
import type { ValidMode } from '../../lib/validateMode.js';
export interface BackupInfo {
    path: string;
    timestamp: number;
    checksum: string;
}
export interface IntegrityResult {
    valid: boolean;
    errors: string[];
}
/**
 * 迁移前备份
 */
export declare function backupBeforeMigration(mode: ValidMode, directory: string): BackupInfo | null;
/**
 * 回滚到备份
 */
export declare function rollbackToBackup(backupInfo: BackupInfo, mode: ValidMode, directory: string): boolean;
/**
 * 验证状态完整性
 */
export declare function verifyIntegrity(mode: ValidMode, directory: string): IntegrityResult;
/**
 * 清理旧备份
 */
export declare function cleanupOldBackups(mode: ValidMode, directory: string, keepCount?: number): number;
//# sourceMappingURL=integrity.d.ts.map
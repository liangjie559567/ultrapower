/**
 * 状态迁移工具
 *
 * 支持从旧版状态文件迁移到新的统一状态管理层
 */
import type { ValidMode } from '../../lib/validateMode.js';
import { backupBeforeMigration, rollbackToBackup, verifyIntegrity, type BackupInfo } from './integrity.js';
export interface MigrationResult {
    success: boolean;
    migratedModes: string[];
    errors: Array<{
        mode: string;
        error: string;
    }>;
}
/**
 * 迁移单个模式的状态（带完整性保障）
 */
export declare function migrateMode(mode: ValidMode, directory: string): boolean;
/**
 * 备份状态文件
 */
export declare function backupState(mode: ValidMode, directory: string): boolean;
export { backupBeforeMigration, rollbackToBackup, verifyIntegrity, type BackupInfo };
//# sourceMappingURL=index.d.ts.map
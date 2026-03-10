/**
 * 状态迁移工具
 *
 * 支持从旧版状态文件迁移到新的统一状态管理层
 */

import { existsSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { createStateManager } from '../index.js';
import type { ValidMode } from '../../lib/validateMode.js';
import { backupBeforeMigration, rollbackToBackup, verifyIntegrity, type BackupInfo } from './integrity.js';

export interface MigrationResult {
  success: boolean;
  migratedModes: string[];
  errors: Array<{ mode: string; error: string }>;
}

/**
 * 迁移单个模式的状态（带完整性保障）
 */
export function migrateMode(mode: ValidMode, directory: string): boolean {
  const legacyPath = join(directory, '.omc', 'state', `${mode}-state.json`);

  if (!existsSync(legacyPath)) {
    return true;
  }

  const backup = backupBeforeMigration(mode, directory);

  try {
    const content = readFileSync(legacyPath, 'utf-8');
    const state = JSON.parse(content);

    const manager = createStateManager({ mode, directory });
    const success = manager.writeSync(state);

    if (!success) {
      if (backup) rollbackToBackup(backup, mode, directory);
      return false;
    }

    const integrity = verifyIntegrity(mode, directory);
    if (!integrity.valid) {
      if (backup) rollbackToBackup(backup, mode, directory);
      return false;
    }

    return true;
  } catch {
    if (backup) rollbackToBackup(backup, mode, directory);
    return false;
  }
}

/**
 * 备份状态文件
 */
export function backupState(mode: ValidMode, directory: string): boolean {
  const statePath = join(directory, '.omc', 'state', `${mode}-state.json`);

  if (!existsSync(statePath)) {
    return true;
  }

  try {
    const backupPath = `${statePath}.backup-${Date.now()}`;
    copyFileSync(statePath, backupPath);
    return true;
  } catch {
    return false;
  }
}

export { backupBeforeMigration, rollbackToBackup, verifyIntegrity, type BackupInfo };

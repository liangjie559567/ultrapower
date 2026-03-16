/**
 * 状态迁移完整性保障
 */
import { existsSync, readFileSync, copyFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
/**
 * 计算文件校验和
 */
function calculateChecksum(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash) + content.charCodeAt(i);
        hash = hash & hash;
    }
    return hash.toString(16);
}
/**
 * 迁移前备份
 */
export function backupBeforeMigration(mode, directory) {
    const statePath = join(directory, '.omc', 'state', `${mode}-state.json`);
    if (!existsSync(statePath)) {
        return null;
    }
    try {
        const content = readFileSync(statePath, 'utf-8');
        const timestamp = Date.now();
        const backupPath = `${statePath}.backup-${timestamp}`;
        copyFileSync(statePath, backupPath);
        return {
            path: backupPath,
            timestamp,
            checksum: calculateChecksum(content)
        };
    }
    catch {
        return null;
    }
}
/**
 * 回滚到备份
 */
export function rollbackToBackup(backupInfo, mode, directory) {
    const statePath = join(directory, '.omc', 'state', `${mode}-state.json`);
    if (!existsSync(backupInfo.path)) {
        return false;
    }
    try {
        copyFileSync(backupInfo.path, statePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * 验证状态完整性
 */
export function verifyIntegrity(mode, directory) {
    const statePath = join(directory, '.omc', 'state', `${mode}-state.json`);
    const errors = [];
    if (!existsSync(statePath)) {
        errors.push('State file does not exist');
        return { valid: false, errors };
    }
    try {
        const content = readFileSync(statePath, 'utf-8');
        const state = JSON.parse(content);
        if (!state.mode || state.mode !== mode) {
            errors.push('Mode mismatch');
        }
        if (typeof state.active !== 'boolean') {
            errors.push('Invalid active field');
        }
        return { valid: errors.length === 0, errors };
    }
    catch (error) {
        errors.push(`Parse error: ${error instanceof Error ? error.message : 'unknown'}`);
        return { valid: false, errors };
    }
}
/**
 * 清理旧备份
 */
export function cleanupOldBackups(mode, directory, keepCount = 5) {
    const stateDir = join(directory, '.omc', 'state');
    const pattern = `${mode}-state.json.backup-`;
    try {
        const files = readdirSync(stateDir)
            .filter((f) => f.startsWith(pattern))
            .map((f) => ({
            name: f,
            path: join(stateDir, f),
            timestamp: parseInt(f.replace(pattern, ''))
        }))
            .sort((a, b) => b.timestamp - a.timestamp);
        let deleted = 0;
        for (let i = keepCount; i < files.length; i++) {
            unlinkSync(files[i].path);
            deleted++;
        }
        return deleted;
    }
    catch {
        return 0;
    }
}
//# sourceMappingURL=integrity.js.map
/**
 * 灾难恢复机制 - BackupManager
 *
 * 提供定期自动备份和 restore 命令
 */
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { assertValidMode } from '../lib/validateMode.js';
export class BackupManager {
    directory;
    maxBackups;
    backupInterval;
    backupTimer;
    constructor(options) {
        this.directory = options.directory;
        this.maxBackups = options.maxBackups ?? 10;
        this.backupInterval = options.backupInterval ?? 3600000; // 1 hour
    }
    /**
     * 获取备份目录路径
     */
    getBackupDir() {
        return join(this.directory, '.omc', 'backups');
    }
    /**
     * 确保备份目录存在
     */
    ensureBackupDir() {
        const backupDir = this.getBackupDir();
        if (!existsSync(backupDir)) {
            mkdirSync(backupDir, { recursive: true });
        }
    }
    /**
     * 获取状态文件路径
     */
    getStatePath(mode, sessionId) {
        const validMode = assertValidMode(mode);
        if (sessionId) {
            return join(this.directory, '.omc', 'state', 'sessions', sessionId, `${validMode}-state.json`);
        }
        return join(this.directory, '.omc', 'state', `${validMode}-state.json`);
    }
    /**
     * 创建备份
     */
    backup(mode, sessionId) {
        try {
            const statePath = this.getStatePath(mode, sessionId);
            if (!existsSync(statePath)) {
                return false;
            }
            this.ensureBackupDir();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = sessionId
                ? `${mode}-${sessionId}-${timestamp}.json`
                : `${mode}-${timestamp}.json`;
            const backupPath = join(this.getBackupDir(), backupName);
            copyFileSync(statePath, backupPath);
            this.cleanOldBackups(mode, sessionId);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 恢复备份
     */
    restore(mode, timestamp, sessionId) {
        try {
            const backupDir = this.getBackupDir();
            if (!existsSync(backupDir)) {
                return false;
            }
            const prefix = sessionId ? `${mode}-${sessionId}-` : `${mode}-`;
            const backups = readdirSync(backupDir)
                .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
                .sort()
                .reverse();
            if (backups.length === 0) {
                return false;
            }
            let backupFile;
            if (timestamp) {
                backupFile = backups.find(f => f.includes(timestamp)) || backups[0];
            }
            else {
                backupFile = backups[0]; // 最新备份
            }
            const backupPath = join(backupDir, backupFile);
            const statePath = this.getStatePath(mode, sessionId);
            const stateDir = join(this.directory, '.omc', 'state');
            if (!existsSync(stateDir)) {
                mkdirSync(stateDir, { recursive: true });
            }
            copyFileSync(backupPath, statePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 清理旧备份
     */
    cleanOldBackups(mode, sessionId) {
        try {
            const backupDir = this.getBackupDir();
            const prefix = sessionId ? `${mode}-${sessionId}-` : `${mode}-`;
            const backups = readdirSync(backupDir)
                .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
                .map(f => ({
                name: f,
                path: join(backupDir, f),
                time: statSync(join(backupDir, f)).mtime.getTime()
            }))
                .sort((a, b) => b.time - a.time);
            // 删除超过最大数量的备份
            backups.slice(this.maxBackups).forEach(backup => {
                unlinkSync(backup.path);
            });
        }
        catch {
            // 清理失败不影响备份操作
        }
    }
    /**
     * 列出所有备份
     */
    listBackups(mode, sessionId) {
        try {
            const backupDir = this.getBackupDir();
            if (!existsSync(backupDir)) {
                return [];
            }
            let backups = readdirSync(backupDir).filter(f => f.endsWith('.json'));
            if (mode) {
                const prefix = sessionId ? `${mode}-${sessionId}-` : `${mode}-`;
                backups = backups.filter(f => f.startsWith(prefix));
            }
            return backups.sort().reverse();
        }
        catch {
            return [];
        }
    }
    /**
     * 启动自动备份
     */
    startAutoBackup(modes) {
        if (this.backupTimer) {
            return;
        }
        this.backupTimer = setInterval(() => {
            modes.forEach(mode => {
                this.backup(mode);
            });
        }, this.backupInterval);
    }
    /**
     * 停止自动备份
     */
    stopAutoBackup() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = undefined;
        }
    }
}
export function createBackupManager(options) {
    return new BackupManager(options);
}
//# sourceMappingURL=backup-manager.js.map
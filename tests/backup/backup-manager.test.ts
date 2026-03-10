/**
 * T-024: 备份恢复测试套件
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BackupManager } from '../../src/state/backup-manager.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'tests', 'backup', '.test-workspace');

describe('BackupManager', () => {
  let manager: BackupManager;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    manager = new BackupManager({ directory: TEST_DIR, maxBackups: 3 });
  });

  afterEach(() => {
    manager.stopAutoBackup();
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('backup()', () => {
    it('创建备份成功', () => {
      const stateDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(join(stateDir, 'team-state.json'), '{"active":true}');

      const result = manager.backup('team');
      expect(result).toBe(true);

      const backups = manager.listBackups('team');
      expect(backups.length).toBe(1);
    });

    it('状态文件不存在时返回 false', () => {
      const result = manager.backup('team');
      expect(result).toBe(false);
    });
  });

  describe('restore()', () => {
    it('恢复最新备份', () => {
      const stateDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(join(stateDir, 'team-state.json'), '{"active":true}');

      manager.backup('team');
      writeFileSync(join(stateDir, 'team-state.json'), '{"active":false}');

      const result = manager.restore('team');
      expect(result).toBe(true);
    });

    it('无备份时返回 false', () => {
      const result = manager.restore('team');
      expect(result).toBe(false);
    });
  });

  describe('cleanOldBackups()', () => {
    it('保留最大备份数量', () => {
      const stateDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(join(stateDir, 'team-state.json'), '{"active":true}');

      for (let i = 0; i < 5; i++) {
        manager.backup('team');
      }

      const backups = manager.listBackups('team');
      expect(backups.length).toBeLessThanOrEqual(3);
    });
  });

  describe('listBackups()', () => {
    it('列出所有备份', () => {
      const stateDir = join(TEST_DIR, '.omc', 'state');
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(join(stateDir, 'team-state.json'), '{"active":true}');

      manager.backup('team');
      manager.backup('team');

      const backups = manager.listBackups('team');
      expect(backups.length).toBeGreaterThan(0);
    });
  });
});

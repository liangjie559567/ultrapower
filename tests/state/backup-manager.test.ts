import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BackupManager } from '../../src/state/backup-manager.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-backup');

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

  it('should create backup', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, 'team-state.json'), '{"active":true}');

    const result = manager.backup('team');
    expect(result).toBe(true);
    expect(manager.listBackups('team').length).toBe(1);
  });

  it('should restore backup', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, 'team-state.json'), '{"active":true}');

    manager.backup('team');
    writeFileSync(join(stateDir, 'team-state.json'), '{"active":false}');

    const result = manager.restore('team');
    expect(result).toBe(true);
  });

  it('should limit backups', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, 'team-state.json'), '{"active":true}');

    for (let i = 0; i < 5; i++) {
      manager.backup('team');
    }

    expect(manager.listBackups('team').length).toBeLessThanOrEqual(3);
  });
});

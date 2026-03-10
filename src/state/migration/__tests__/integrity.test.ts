import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { backupBeforeMigration, rollbackToBackup, verifyIntegrity, cleanupOldBackups } from '../../migration/integrity.js';

const TEST_DIR = join(process.cwd(), '.test-integrity');

describe('Migration Integrity', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should create backup with checksum', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, 'team-state.json'), JSON.stringify({ active: true }));

    const backup = backupBeforeMigration('team', TEST_DIR);

    expect(backup).not.toBeNull();
    expect(backup?.checksum).toBeDefined();
    expect(existsSync(backup!.path)).toBe(true);
  });

  it('should rollback to backup', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });
    const original = { active: true, mode: 'ralph' };
    writeFileSync(join(stateDir, 'ralph-state.json'), JSON.stringify(original));

    const backup = backupBeforeMigration('ralph', TEST_DIR);
    writeFileSync(join(stateDir, 'ralph-state.json'), 'corrupted');

    const success = rollbackToBackup(backup!, 'ralph', TEST_DIR);
    expect(success).toBe(true);
  });

  it('should verify valid state', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, 'pipeline-state.json'), JSON.stringify({ active: true, mode: 'pipeline' }));

    const result = verifyIntegrity('pipeline', TEST_DIR);
    expect(result.valid).toBe(true);
  });

  it('should detect invalid state', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, 'ultrawork-state.json'), JSON.stringify({ active: 'invalid' }));

    const result = verifyIntegrity('ultrawork', TEST_DIR);
    expect(result.valid).toBe(false);
  });

  it('should cleanup old backups', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    for (let i = 0; i < 10; i++) {
      writeFileSync(join(stateDir, `autopilot-state.json.backup-${i}`), '{}');
    }

    const deleted = cleanupOldBackups('autopilot', TEST_DIR, 3);
    expect(deleted).toBe(7);
  });
});

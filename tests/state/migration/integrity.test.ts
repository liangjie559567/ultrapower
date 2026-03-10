import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  backupBeforeMigration,
  rollbackToBackup,
  verifyIntegrity,
  cleanupOldBackups
} from '../../../src/state/migration/integrity.js';

const testDir = join(process.cwd(), 'test-integrity-temp');
const stateDir = join(testDir, '.omc', 'state');

beforeEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  mkdirSync(stateDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
});

describe('backupBeforeMigration', () => {
  it('creates backup with checksum', () => {
    const statePath = join(stateDir, 'autopilot-state.json');
    writeFileSync(statePath, JSON.stringify({ mode: 'autopilot', active: true }));

    const backup = backupBeforeMigration('autopilot', testDir);

    expect(backup).not.toBeNull();
    expect(backup?.checksum).toBeTruthy();
    expect(existsSync(backup!.path)).toBe(true);
  });

  it('returns null if no state file', () => {
    const backup = backupBeforeMigration('autopilot', testDir);
    expect(backup).toBeNull();
  });
});

describe('rollbackToBackup', () => {
  it('restores from backup', () => {
    const statePath = join(stateDir, 'autopilot-state.json');
    const originalState = { mode: 'autopilot', active: true };
    writeFileSync(statePath, JSON.stringify(originalState));

    const backup = backupBeforeMigration('autopilot', testDir);
    writeFileSync(statePath, JSON.stringify({ mode: 'autopilot', active: false }));

    const result = rollbackToBackup(backup!, 'autopilot', testDir);

    expect(result).toBe(true);
    expect(JSON.parse(require('fs').readFileSync(statePath, 'utf-8'))).toEqual(originalState);
  });
});

describe('verifyIntegrity', () => {
  it('validates correct state', () => {
    const statePath = join(stateDir, 'autopilot-state.json');
    writeFileSync(statePath, JSON.stringify({ mode: 'autopilot', active: true }));

    const result = verifyIntegrity('autopilot', testDir);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects mode mismatch', () => {
    const statePath = join(stateDir, 'autopilot-state.json');
    writeFileSync(statePath, JSON.stringify({ mode: 'ralph', active: true }));

    const result = verifyIntegrity('autopilot', testDir);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Mode mismatch');
  });
});

describe('cleanupOldBackups', () => {
  it('removes old backups', () => {
    for (let i = 0; i < 7; i++) {
      writeFileSync(join(stateDir, `autopilot-state.json.backup-${1000 + i}`), '{}');
    }

    const deleted = cleanupOldBackups('autopilot', testDir, 3);

    expect(deleted).toBe(4);
  });
});

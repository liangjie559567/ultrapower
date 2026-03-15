import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { migrateMode, backupState, backupBeforeMigration, rollbackToBackup, verifyIntegrity } from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-migration');

describe('State Migration', () => {
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

  it('should migrate legacy state', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    const legacyState = { active: true, iteration: 5, mode: 'autopilot' };
    writeFileSync(
      join(stateDir, 'autopilot-state.json'),
      JSON.stringify(legacyState)
    );

    const result = migrateMode('autopilot', TEST_DIR);
    expect(result).toBe(true);
  });

  it('should backup state before migration', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    const statePath = join(stateDir, 'ralph-state.json');
    writeFileSync(statePath, JSON.stringify({ active: true }));

    const result = backupState('ralph', TEST_DIR);
    expect(result).toBe(true);
  });

  it('should create backup before migration', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    const state = { active: true, mode: 'team' };
    writeFileSync(join(stateDir, 'team-state.json'), JSON.stringify(state));

    const backup = backupBeforeMigration('team', TEST_DIR);
    expect(backup).not.toBeNull();
    expect(backup?.path).toContain('team-state.json.backup-');
    expect(existsSync(backup!.path)).toBe(true);
  });

  it('should rollback on migration failure', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    const originalState = { active: true, mode: 'pipeline' };
    writeFileSync(join(stateDir, 'pipeline-state.json'), JSON.stringify(originalState));

    const backup = backupBeforeMigration('pipeline', TEST_DIR);
    expect(backup).not.toBeNull();

    writeFileSync(join(stateDir, 'pipeline-state.json'), 'invalid json');

    const rollback = rollbackToBackup(backup!, 'pipeline', TEST_DIR);
    expect(rollback).toBe(true);

    const restored = JSON.parse(readFileSync(join(stateDir, 'pipeline-state.json'), 'utf-8'));
    expect(restored).toEqual(originalState);
  });

  it('should verify state integrity', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    const validState = { active: true, mode: 'ultrawork' };
    writeFileSync(join(stateDir, 'ultrawork-state.json'), JSON.stringify(validState));

    const result = verifyIntegrity('ultrawork', TEST_DIR);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid state', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    const invalidState = { active: 'yes', mode: 'wrong' };
    writeFileSync(join(stateDir, 'ultraqa-state.json'), JSON.stringify(invalidState));

    const result = verifyIntegrity('ultraqa', TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should auto-rollback on integrity failure', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    const validState = { active: true, mode: 'ralph', iteration: 1 };
    writeFileSync(join(stateDir, 'ralph-state.json'), JSON.stringify(validState));

    const _backup = backupBeforeMigration('ralph', TEST_DIR);

    writeFileSync(join(stateDir, 'ralph-state.json'), JSON.stringify({ active: 'invalid' }));

    const result = migrateMode('ralph', TEST_DIR);
    expect(result).toBe(false);

    const files = readdirSync(stateDir).filter(f => f.includes('backup-'));
    expect(files.length).toBeGreaterThan(0);
  });
});

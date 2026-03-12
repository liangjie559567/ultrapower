/**
 * T-024: 灾难演练脚本
 *
 * 模拟灾难场景并验证恢复能力
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BackupManager } from '../../src/state/backup-manager.js';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'tests', 'backup', '.drill-workspace');

describe('灾难演练', () => {
  let manager: BackupManager;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    manager = new BackupManager({ directory: TEST_DIR });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('场景1: 状态文件损坏', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    const originalData = { active: true, iteration: 5 };
    writeFileSync(join(stateDir, 'team-state.json'), JSON.stringify(originalData));

    manager.backup('team');

    writeFileSync(join(stateDir, 'team-state.json'), 'corrupted{data');

    const restored = manager.restore('team');
    expect(restored).toBe(true);

    const restoredData = JSON.parse(readFileSync(join(stateDir, 'team-state.json'), 'utf-8'));
    expect(restoredData).toEqual(originalData);
  });

  it('场景2: 状态文件丢失', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    writeFileSync(join(stateDir, 'ralph-state.json'), '{"active":true}');
    manager.backup('ralph');

    rmSync(join(stateDir, 'ralph-state.json'));

    const restored = manager.restore('ralph');
    expect(restored).toBe(true);
    expect(existsSync(join(stateDir, 'ralph-state.json'))).toBe(true);
  });

  it('场景3: 多模式同时恢复', () => {
    const stateDir = join(TEST_DIR, '.omc', 'state');
    mkdirSync(stateDir, { recursive: true });

    writeFileSync(join(stateDir, 'team-state.json'), '{"mode":"team"}');
    writeFileSync(join(stateDir, 'ralph-state.json'), '{"mode":"ralph"}');

    manager.backup('team');
    manager.backup('ralph');

    rmSync(stateDir, { recursive: true, force: true });

    expect(manager.restore('team')).toBe(true);
    expect(manager.restore('ralph')).toBe(true);
  });
});

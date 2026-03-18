import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createStateManager } from '../index.js';

describe('StateManager', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'state-manager-test-'));
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should write and read state', () => {
    const manager = createStateManager({ mode: 'autopilot', directory: testDir });
    const state = { active: true, iteration: 1 };

    const written = manager.writeSync(state);
    expect(written).toBe(true);

    const read = manager.read();
    expect(read).toEqual(state);
  });

  it('should support session-scoped state', () => {
    const manager = createStateManager({ mode: 'team', directory: testDir });
    const state1 = { active: true, team_name: 'test-team-1' };
    const state2 = { active: true, team_name: 'test-team-2' };

    manager.writeSync(state1, 'session-1');
    manager.writeSync(state2, 'session-2');

    expect(manager.read('session-1')).toEqual(state1);
    expect(manager.read('session-2')).toEqual(state2);
  });

  it('should clear state', () => {
    const manager = createStateManager({ mode: 'ralph', directory: testDir });
    manager.writeSync({ active: true });

    expect(manager.exists()).toBe(true);
    manager.clear();
    expect(manager.exists()).toBe(false);
  });
});

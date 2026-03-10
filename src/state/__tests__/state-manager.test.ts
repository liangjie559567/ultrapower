import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { createStateManager } from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-state-manager');

describe('StateManager', () => {
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

  it('should write and read state', () => {
    const manager = createStateManager({ mode: 'autopilot', directory: TEST_DIR });
    const state = { active: true, iteration: 1 };

    const written = manager.writeSync(state);
    expect(written).toBe(true);

    const read = manager.read();
    expect(read).toEqual(state);
  });

  it('should support session-scoped state', () => {
    const manager = createStateManager({ mode: 'team', directory: TEST_DIR });
    const state1 = { active: true, team_name: 'test-team-1' };
    const state2 = { active: true, team_name: 'test-team-2' };

    manager.writeSync(state1, 'session-1');
    manager.writeSync(state2, 'session-2');

    expect(manager.read('session-1')).toEqual(state1);
    expect(manager.read('session-2')).toEqual(state2);
  });

  it('should clear state', () => {
    const manager = createStateManager({ mode: 'ralph', directory: TEST_DIR });
    manager.writeSync({ active: true });

    expect(manager.exists()).toBe(true);
    manager.clear();
    expect(manager.exists()).toBe(false);
  });
});

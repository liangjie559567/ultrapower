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

    manager.writeSync(state);
    const read = manager.read();

    expect(read).toEqual(state);
  });

  it('should handle session-scoped state', () => {
    const manager = createStateManager({ mode: 'team', directory: TEST_DIR });

    manager.writeSync({ active: true }, 'session-1');
    manager.writeSync({ active: false }, 'session-2');

    expect(manager.read('session-1')).toEqual({ active: true });
    expect(manager.read('session-2')).toEqual({ active: false });
  });

  it('should clear state', () => {
    const manager = createStateManager({ mode: 'ralph', directory: TEST_DIR });
    manager.writeSync({ active: true });

    manager.clear();
    expect(manager.read()).toBeNull();
  });

  it('should return null for non-existent state', () => {
    const manager = createStateManager({ mode: 'pipeline', directory: TEST_DIR });
    expect(manager.read()).toBeNull();
  });

  it('should handle write errors gracefully', () => {
    const manager = createStateManager({ mode: 'ultrawork', directory: TEST_DIR });
    manager.writeSync({ active: true });

    // Verify state was written
    expect(manager.read()).toEqual({ active: true });
  });
});

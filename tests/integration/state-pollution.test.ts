import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createStateManager } from '../../src/state/index';

describe('T-024 状态污染测试', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(process.cwd(), '.test-pollution-' + Date.now());
    mkdirSync(join(testDir, '.omc', 'state'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('scenario 1: session A crash leaves dirty state, session B should not read it', async () => {
    const sessionA = 'session-crash-' + Date.now();
    const sessionB = 'session-clean-' + Date.now();

    // Session A writes state then crashes (simulated by not cleaning up)
    const managerA = createStateManager({
      mode: 'autopilot',
      directory: testDir,
      sessionId: sessionA
    });

    await managerA.write({
      active: true,
      iteration: 5,
      task: 'crashed-task',
      session_id: sessionA
    }, sessionA);

    // Verify session A state exists
    expect(managerA.exists(sessionA)).toBe(true);

    // Session B attempts to read - should get null due to session_id mismatch
    const managerB = createStateManager({
      mode: 'autopilot',
      directory: testDir,
      sessionId: sessionB
    });

    const stateB = managerB.read(sessionB);
    expect(stateB).toBeNull();
  });

  it('scenario 2: concurrent clear operations on same mode state', async () => {
    const sessionA = 'session-concurrent-a-' + Date.now();
    const sessionB = 'session-concurrent-b-' + Date.now();

    const managerA = createStateManager({
      mode: 'ralph',
      directory: testDir,
      sessionId: sessionA
    });

    const managerB = createStateManager({
      mode: 'ralph',
      directory: testDir,
      sessionId: sessionB
    });

    // Both sessions write their own state
    await managerA.write({ active: true, iteration: 1, session_id: sessionA }, sessionA);
    await managerB.write({ active: true, iteration: 2, session_id: sessionB }, sessionB);

    // Both sessions attempt to clear concurrently
    const clearA = managerA.clear(sessionA);
    const clearB = managerB.clear(sessionB);

    // Both should succeed without interfering
    expect(clearA).toBe(true);
    expect(clearB).toBe(true);

    // Verify both are cleared
    expect(managerA.exists(sessionA)).toBe(false);
    expect(managerB.exists(sessionB)).toBe(false);
  });

  it('scenario 3: legacy state file compatibility (session_id null/undefined)', async () => {
    const legacyStatePath = join(testDir, '.omc', 'state', 'team-state.json');

    // Simulate legacy state file without session_id
    writeFileSync(legacyStatePath, JSON.stringify({
      mode: 'team',
      active: true,
      iteration: 42,
      team_name: 'legacy-team',
      session_id: null
    }));

    // New session should be able to read legacy state
    const manager = createStateManager({
      mode: 'team',
      directory: testDir,
      sessionId: 'new-session-' + Date.now()
    });

    const state = manager.read();
    expect(state).toBeDefined();
    expect(state?.iteration).toBe(42);
    expect(state?.team_name).toBe('legacy-team');
  });

  it('scenario 3b: legacy state file with undefined session_id', async () => {
    const legacyStatePath = join(testDir, '.omc', 'state', 'ultrawork-state.json');

    // Simulate legacy state file without session_id field at all
    writeFileSync(legacyStatePath, JSON.stringify({
      mode: 'ultrawork',
      active: true,
      iteration: 99
    }));

    const manager = createStateManager({
      mode: 'ultrawork',
      directory: testDir,
      sessionId: 'new-session-' + Date.now()
    });

    const state = manager.read();
    expect(state).toBeDefined();
    expect(state?.iteration).toBe(99);
  });
});

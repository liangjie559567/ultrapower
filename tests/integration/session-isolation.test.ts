import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createStateManager } from '../../src/state/index';

describe('T-013 跨会话污染测试', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(process.cwd(), '.test-session-' + Date.now());
    mkdirSync(join(testDir, '.omc', 'state'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should isolate session A crash from session B read', async () => {
    const sessionA = 'session-a-' + Date.now();
    const sessionB = 'session-b-' + Date.now();

    const managerA = createStateManager({
      mode: 'autopilot',
      directory: testDir,
      sessionId: sessionA
    });

    await managerA.write({ active: true, iteration: 1, task: 'session-a-task' });

    const managerB = createStateManager({
      mode: 'autopilot',
      directory: testDir,
      sessionId: sessionB
    });

    const stateB = await managerB.read();

    expect(stateB).toBeNull();
  });

  it('should verify session_id matching on read', async () => {
    const sessionId = 'test-session-' + Date.now();

    const manager1 = createStateManager({
      mode: 'ralph',
      directory: testDir,
      sessionId
    });

    await manager1.write({ active: true, iteration: 5 });

    const manager2 = createStateManager({
      mode: 'ralph',
      directory: testDir,
      sessionId
    });

    const state = await manager2.read();
    expect(state).toBeDefined();
    expect(state?.iteration).toBe(5);
  });

  it('should handle legacy state files without session_id', async () => {
    const statePath = join(testDir, '.omc', 'state', 'team-state.json');

    writeFileSync(statePath, JSON.stringify({
      mode: 'team',
      active: true,
      iteration: 10,
      session_id: null
    }));

    const manager = createStateManager({
      mode: 'team',
      directory: testDir,
      sessionId: 'new-session'
    });

    const state = await manager.read();
    expect(state).toBeDefined();
    expect(state?.iteration).toBe(10);
  });

  it('should reject cross-session state access', async () => {
    const sessionA = 'session-alpha';
    const sessionB = 'session-beta';

    const managerA = createStateManager({
      mode: 'ultrawork',
      directory: testDir,
      sessionId: sessionA
    });

    await managerA.write({ active: true, data: 'confidential' });

    const managerB = createStateManager({
      mode: 'ultrawork',
      directory: testDir,
      sessionId: sessionB
    });

    const state = await managerB.read();
    expect(state).toBeNull();
  });
});

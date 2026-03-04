import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createAgentUsageReminderHook, loadAgentUsageState, saveAgentUsageState } from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-agent-usage-reminder');

describe('agent-usage-reminder hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  it('should create hook with handlers', () => {
    const hook = createAgentUsageReminderHook();
    expect(hook['tool.execute.after']).toBeDefined();
    expect(hook.event).toBeDefined();
  });

  it('should save and load state', () => {
    const state = { sessionID: 'test', agentUsed: true, reminderCount: 1, updatedAt: Date.now() };
    saveAgentUsageState(state);
    const loaded = loadAgentUsageState('test');
    expect(loaded?.agentUsed).toBe(true);
  });

  it('should handle event', async () => {
    const hook = createAgentUsageReminderHook();
    await hook.event({ event: { type: 'session.deleted', properties: { info: { id: 'test' } } } });
    expect(true).toBe(true);
  });
});

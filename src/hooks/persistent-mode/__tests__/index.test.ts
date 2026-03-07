import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { checkPersistentModes, createHookOutput } from '../index.js';
import * as worktreePaths from '../../../lib/worktree-paths.js';

const TEST_DIR = join(process.cwd(), '.test-persistent-mode');
const SESSION_ID = 'test-session-123';

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
  mkdirSync(join(TEST_DIR, '.omc', 'state'), { recursive: true });

  // Mock resolveToWorktreeRoot to return TEST_DIR
  vi.spyOn(worktreePaths, 'resolveToWorktreeRoot').mockReturnValue(TEST_DIR);
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  vi.restoreAllMocks();
});

describe('persistent-mode', () => {
  it('should not block when no persistent modes active', async () => {
    const result = await checkPersistentModes(SESSION_ID, TEST_DIR);

    expect(result.shouldBlock).toBe(false);
    expect(result.mode).toBe('none');
    expect(result.message).toBe('');
  });

  it('should block for active ralph loop', async () => {
    const ralphState = {
      active: true,
      session_id: SESSION_ID,
      started_at: new Date().toISOString(),
      iteration: 1,
      max_iterations: 10,
      prompt: 'Test task'
    };
    const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', SESSION_ID);
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(
      join(sessionDir, 'ralph-state.json'),
      JSON.stringify(ralphState)
    );

    const result = await checkPersistentModes(SESSION_ID, TEST_DIR);

    expect(result.shouldBlock).toBe(true);
    expect(result.mode).toBe('ralph');
    expect(result.message).toContain('RALPH - ITERATION');
    expect(result.metadata?.iteration).toBe(2);
  });

  it('should block for active ultrawork', async () => {
    const ultraworkState = {
      active: true,
      session_id: SESSION_ID,
      started_at: new Date().toISOString(),
      original_prompt: 'Test task',
      project_path: TEST_DIR,
      reinforcement_count: 0,
      last_checked_at: new Date().toISOString()
    };
    const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', SESSION_ID);
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(
      join(sessionDir, 'ultrawork-state.json'),
      JSON.stringify(ultraworkState)
    );

    const result = await checkPersistentModes(SESSION_ID, TEST_DIR);

    expect(result.shouldBlock).toBe(true);
    expect(result.mode).toBe('ultrawork');
    expect(result.metadata?.reinforcementCount).toBe(1);
  });

  it('should not block on context-limit stop', async () => {
    const ralphState = {
      active: true,
      session_id: SESSION_ID,
      started_at: new Date().toISOString(),
      iteration: 1,
      max_iterations: 10,
      prompt: 'Test task'
    };
    const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', SESSION_ID);
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(
      join(sessionDir, 'ralph-state.json'),
      JSON.stringify(ralphState)
    );

    const result = await checkPersistentModes(SESSION_ID, TEST_DIR, {
      stop_reason: 'context_limit',
      end_turn_reason: 'max_tokens'
    });

    expect(result.shouldBlock).toBe(false);
    expect(result.mode).toBe('none');
  });

  it('should not block on user abort', async () => {
    const ultraworkState = {
      active: true,
      session_id: SESSION_ID,
      started_at: new Date().toISOString(),
      original_prompt: 'Test task',
      project_path: TEST_DIR,
      reinforcement_count: 0,
      last_checked_at: new Date().toISOString()
    };
    const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', SESSION_ID);
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(
      join(sessionDir, 'ultrawork-state.json'),
      JSON.stringify(ultraworkState)
    );

    const result = await checkPersistentModes(SESSION_ID, TEST_DIR, {
      stop_reason: 'user_cancel',
      user_requested: true
    });

    expect(result.shouldBlock).toBe(false);
    expect(result.mode).toBe('none');
  });

  it('should create hook output with continue true', () => {
    const result = {
      shouldBlock: true,
      message: 'Test message',
      mode: 'ralph' as const
    };

    const output = createHookOutput(result);

    expect(output.continue).toBe(true);
    expect(output.message).toBe('Test message');
  });
});


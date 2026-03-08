import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logTokenUsage, getSessionStats, getAllStats } from './index';
import { unlink } from 'fs/promises';
import { join } from 'path';

const TOKEN_LOG_FILE = join(process.cwd(), '.omc', 'logs', 'tokens.jsonl');
const SESSION_INDEX_FILE = join(process.cwd(), '.omc', 'logs', 'token-index.json');

describe('Token Tracker', () => {
  beforeEach(async () => {
    await unlink(TOKEN_LOG_FILE).catch(() => {});
    await unlink(SESSION_INDEX_FILE).catch(() => {});
  });

  afterEach(async () => {
    await unlink(TOKEN_LOG_FILE).catch(() => {});
    await unlink(SESSION_INDEX_FILE).catch(() => {});
  });

  it('logs token usage and retrieves session stats', async () => {
    await logTokenUsage({
      sessionId: 'test-session',
      timestamp: Date.now(),
      inputTokens: 100,
      outputTokens: 50,
      model: 'claude-sonnet-4'
    });

    await logTokenUsage({
      sessionId: 'test-session',
      timestamp: Date.now(),
      inputTokens: 200,
      outputTokens: 100,
      model: 'claude-sonnet-4'
    });

    const stats = await getSessionStats('test-session');
    expect(stats.totalInput).toBe(300);
    expect(stats.totalOutput).toBe(150);
    expect(stats.recordCount).toBe(2);
    expect(stats.models['claude-sonnet-4']).toEqual({ input: 300, output: 150 });
  });

  it('handles multiple sessions independently', async () => {
    await logTokenUsage({
      sessionId: 'session-1',
      timestamp: Date.now(),
      inputTokens: 100,
      outputTokens: 50,
      model: 'claude-sonnet-4'
    });

    await logTokenUsage({
      sessionId: 'session-2',
      timestamp: Date.now(),
      inputTokens: 200,
      outputTokens: 100,
      model: 'claude-opus-4'
    });

    const stats1 = await getSessionStats('session-1');
    const stats2 = await getSessionStats('session-2');

    expect(stats1.totalInput).toBe(100);
    expect(stats2.totalInput).toBe(200);
  });

  it('aggregates all stats correctly', async () => {
    await logTokenUsage({
      sessionId: 'session-1',
      timestamp: Date.now(),
      inputTokens: 100,
      outputTokens: 50,
      model: 'claude-sonnet-4'
    });

    await logTokenUsage({
      sessionId: 'session-2',
      timestamp: Date.now(),
      inputTokens: 200,
      outputTokens: 100,
      model: 'claude-opus-4'
    });

    const allStats = await getAllStats();
    expect(allStats.totalInput).toBe(300);
    expect(allStats.totalOutput).toBe(150);
    expect(allStats.recordCount).toBe(2);
  });
});

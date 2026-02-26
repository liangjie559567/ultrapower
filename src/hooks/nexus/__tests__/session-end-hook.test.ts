import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleNexusSessionEnd } from '../session-end-hook.js';

describe('handleNexusSessionEnd', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `nexus-se-test-${Date.now()}`);
    mkdirSync(join(tmpDir, '.omc', 'nexus'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.omc', 'nexus', 'config.json'),
      JSON.stringify({ enabled: true, gitRemote: '' }) // no remote = no push
    );
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('collects event and returns result', async () => {
    const result = await handleNexusSessionEnd({
      sessionId: 'test-sess-789',
      directory: tmpDir,
      durationMs: 60000,
      agentsSpawned: 1,
      agentsCompleted: 1,
      modesUsed: ['ultrawork'],
    });
    expect(result.collected).toBe(true);
    // sync skipped because gitRemote is empty
    expect(result.synced).toBe(false);
  });

  it('returns not collected when nexus disabled', async () => {
    writeFileSync(
      join(tmpDir, '.omc', 'nexus', 'config.json'),
      JSON.stringify({ enabled: false })
    );
    const result = await handleNexusSessionEnd({
      sessionId: 'test-sess-000',
      directory: tmpDir,
    });
    expect(result.collected).toBe(false);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { collectSessionEvent, getEventsDir } from '../data-collector.js';
import type { SessionEvent } from '../types.js';

describe('collectSessionEvent', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `nexus-dc-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    // Enable nexus in config
    const configDir = join(tmpDir, '.omc', 'nexus');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, 'config.json'), JSON.stringify({ enabled: true }));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes event JSON to .omc/nexus/events/', async () => {
    const event: SessionEvent = {
      sessionId: 'test-session-123',
      timestamp: '2026-02-26T14:00:00Z',
      directory: tmpDir,
      toolCalls: [],
      agentsSpawned: 2,
      agentsCompleted: 2,
      modesUsed: ['ultrawork'],
      skillsInjected: [],
      patternsSeen: [],
    };
    await collectSessionEvent(tmpDir, event);
    const eventsDir = getEventsDir(tmpDir);
    expect(existsSync(eventsDir)).toBe(true);
    const files = readdirSync(eventsDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^test-session-123-\d+\.json$/);
    const content = JSON.parse(readFileSync(join(eventsDir, files[0]), 'utf-8'));
    expect(content.sessionId).toBe('test-session-123');
    expect(content.agentsSpawned).toBe(2);
  });

  it('does nothing when nexus is disabled', async () => {
    const disabledDir = join(tmpdir(), `nexus-disabled-${Date.now()}`);
    mkdirSync(disabledDir, { recursive: true });
    const event: SessionEvent = {
      sessionId: 'test-session-456',
      timestamp: '2026-02-26T14:00:00Z',
      directory: disabledDir,
      toolCalls: [],
      agentsSpawned: 0,
      agentsCompleted: 0,
      modesUsed: [],
      skillsInjected: [],
      patternsSeen: [],
    };
    await collectSessionEvent(disabledDir, event);
    const eventsDir = getEventsDir(disabledDir);
    expect(existsSync(eventsDir)).toBe(false);
    rmSync(disabledDir, { recursive: true, force: true });
  });
});

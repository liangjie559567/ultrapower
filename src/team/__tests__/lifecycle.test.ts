import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { registerMcpWorker, unregisterMcpWorker, listMcpWorkers } from '../team-registration.js';
import { cleanupWorkerFiles } from '../inbox-outbox.js';
import { cleanupTeamHeartbeats } from '../heartbeat.js';

let TEST_TEAM: string;
let TEAMS_DIR: string;
let TEST_WD: string;

beforeEach(() => {
  TEST_TEAM = `test-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  TEAMS_DIR = join(homedir(), '.claude', 'teams', TEST_TEAM);
  TEST_WD = join(homedir(), '.claude', 'test-wd-' + Date.now());
  mkdirSync(join(TEAMS_DIR, 'inbox'), { recursive: true });
  mkdirSync(join(TEST_WD, '.omc', 'state'), { recursive: true });
});

afterEach(() => {
  rmSync(TEAMS_DIR, { recursive: true, force: true });
  rmSync(TEST_WD, { recursive: true, force: true });
});

describe('Team Lifecycle', () => {
  describe('Worker Registration', () => {
    it('registers MCP worker', () => {
      registerMcpWorker(TEST_TEAM, 'w1', 'codex', 'gpt-5.3-codex', 'tmux-1', TEST_WD, TEST_WD);
      const workers = listMcpWorkers(TEST_TEAM, TEST_WD);
      expect(workers).toHaveLength(1);
      expect(workers[0].name).toBe('w1');
      expect(workers[0].agentType).toBe('mcp-codex');
    });

    it('unregisters worker', () => {
      registerMcpWorker(TEST_TEAM, 'w1', 'codex', 'gpt-5.3-codex', 'tmux-1', TEST_WD, TEST_WD);
      unregisterMcpWorker(TEST_TEAM, 'w1', TEST_WD);
      expect(listMcpWorkers(TEST_TEAM, TEST_WD)).toHaveLength(0);
    });
  });

  describe('Cleanup', () => {
    it('removes worker files', () => {
      const inboxPath = join(TEAMS_DIR, 'inbox', 'w1.jsonl');
      mkdirSync(join(TEAMS_DIR, 'inbox'), { recursive: true });
      require('fs').writeFileSync(inboxPath, '{}');

      cleanupWorkerFiles(TEST_TEAM, 'w1');
      expect(existsSync(inboxPath)).toBe(false);
    });

    it('cleans team heartbeats', () => {
      cleanupTeamHeartbeats(TEST_WD, TEST_TEAM);
      // Should not throw
    });
  });
});

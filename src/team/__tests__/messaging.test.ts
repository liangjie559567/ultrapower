import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { routeMessage, broadcastToTeam } from '../message-router.js';
import { registerMcpWorker } from '../team-registration.js';

let TEST_TEAM: string;
let TEAMS_DIR: string;
let TEST_WD: string;

beforeEach(() => {
  TEST_TEAM = `test-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  TEAMS_DIR = join(homedir(), '.claude', 'teams', TEST_TEAM);
  TEST_WD = join(homedir(), '.claude', 'test-wd-' + Date.now());
  mkdirSync(join(TEAMS_DIR, 'inbox'), { recursive: true });
  mkdirSync(join(TEST_WD, '.omc', 'state'), { recursive: true });
});

afterEach(() => {
  rmSync(TEAMS_DIR, { recursive: true, force: true });
  rmSync(TEST_WD, { recursive: true, force: true });
});

describe('Team Messaging', () => {
  describe('routeMessage', () => {
    it('routes to MCP worker inbox', () => {
      registerMcpWorker(TEST_TEAM, 'w1', 'codex', 'gpt-5.3-codex', 'tmux-1', TEST_WD, TEST_WD);

      const result = routeMessage(TEST_TEAM, 'w1', 'test message', TEST_WD);

      expect(result.method).toBe('inbox');
      const inboxPath = join(TEAMS_DIR, 'inbox', 'w1.jsonl');
      const content = readFileSync(inboxPath, 'utf-8');
      expect(content).toContain('test message');
    });

    it('returns native for unknown recipient', () => {
      const result = routeMessage(TEST_TEAM, 'unknown', 'msg', TEST_WD);
      expect(result.method).toBe('native');
    });
  });

  describe('broadcastToTeam', () => {
    it('broadcasts to all MCP workers', () => {
      registerMcpWorker(TEST_TEAM, 'w1', 'codex', 'gpt-5.3-codex', 'tmux-1', TEST_WD, TEST_WD);
      registerMcpWorker(TEST_TEAM, 'w2', 'gemini', 'gemini-3-pro', 'tmux-2', TEST_WD, TEST_WD);

      const result = broadcastToTeam(TEST_TEAM, 'broadcast msg', TEST_WD);

      expect(result.inboxRecipients).toHaveLength(2);
      expect(result.inboxRecipients).toContain('w1');
      expect(result.inboxRecipients).toContain('w2');
    });
  });
});

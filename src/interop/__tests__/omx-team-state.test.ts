import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  listOmxTeams,
  readOmxTeamConfig,
  readOmxMailbox,
  listOmxMailboxMessages,
  sendOmxDirectMessage,
  broadcastOmxMessage,
  markOmxMessageDelivered,
  readOmxTask,
  listOmxTasks,
  appendOmxTeamEvent,
} from '../omx-team-state.js';

describe('OMX Team State', () => {
  const testDir = join(process.cwd(), '.test-omx');
  const teamName = 'test-team';

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
  });

  const createTeamDir = () => {
    const dir = join(testDir, '.omx', 'state', 'team', teamName);
    mkdirSync(dir, { recursive: true });
    return dir;
  };

  describe('listOmxTeams', () => {
    it('returns empty array when no teams exist', async () => {
      expect(await listOmxTeams(testDir)).toEqual([]);
    });

    it('lists team directories', async () => {
      mkdirSync(join(testDir, '.omx', 'state', 'team', 'team1'), { recursive: true });
      mkdirSync(join(testDir, '.omx', 'state', 'team', 'team2'), { recursive: true });
      const teams = await listOmxTeams(testDir);
      expect(teams).toEqual(['team1', 'team2']);
    });
  });

  describe('readOmxTeamConfig', () => {
    it('returns null when team does not exist', async () => {
      expect(await readOmxTeamConfig(teamName, testDir)).toBeNull();
    });

    it('reads manifest.v2.json', async () => {
      const dir = createTeamDir();
      writeFileSync(join(dir, 'manifest.v2.json'), JSON.stringify({
        schema_version: 2,
        name: teamName,
        task: 'Test task',
        worker_count: 2,
        workers: [{ name: 'w1', index: 0, role: 'executor', assigned_tasks: [] }],
        created_at: '2026-01-01T00:00:00Z',
        tmux_session: 'test',
        next_task_id: 1,
      }));
      const config = await readOmxTeamConfig(teamName, testDir);
      expect(config?.name).toBe(teamName);
      expect(config?.worker_count).toBe(2);
    });

    it('falls back to config.json', async () => {
      const dir = createTeamDir();
      writeFileSync(join(dir, 'config.json'), JSON.stringify({
        name: teamName,
        task: 'Test',
        agent_type: 'executor',
        worker_count: 1,
        max_workers: 5,
        workers: [],
        created_at: '2026-01-01T00:00:00Z',
        tmux_session: 'test',
        next_task_id: 1,
      }));
      const config = await readOmxTeamConfig(teamName, testDir);
      expect(config?.name).toBe(teamName);
    });
  });

  describe('mailbox operations', () => {
    beforeEach(() => {
      createTeamDir();
      mkdirSync(join(testDir, '.omx', 'state', 'team', teamName, 'mailbox'), { recursive: true });
    });

    it('readOmxMailbox returns empty for non-existent mailbox', async () => {
      const mailbox = await readOmxMailbox(teamName, 'worker1', testDir);
      expect(mailbox.messages).toEqual([]);
    });

    it('sendOmxDirectMessage creates message', async () => {
      const msg = await sendOmxDirectMessage(teamName, 'w1', 'w2', 'Hello', testDir);
      expect(msg.from_worker).toBe('w1');
      expect(msg.to_worker).toBe('w2');
      expect(msg.body).toBe('Hello');
    });

    it('listOmxMailboxMessages retrieves messages', async () => {
      await sendOmxDirectMessage(teamName, 'w1', 'w2', 'Msg1', testDir);
      await sendOmxDirectMessage(teamName, 'w1', 'w2', 'Msg2', testDir);
      const messages = await listOmxMailboxMessages(teamName, 'w2', testDir);
      expect(messages).toHaveLength(2);
    });

    it('markOmxMessageDelivered sets delivered_at', async () => {
      const msg = await sendOmxDirectMessage(teamName, 'w1', 'w2', 'Test', testDir);
      const result = await markOmxMessageDelivered(teamName, 'w2', msg.message_id, testDir);
      expect(result).toBe(true);
      const messages = await listOmxMailboxMessages(teamName, 'w2', testDir);
      expect(messages[0].delivered_at).toBeDefined();
    });

    it('broadcastOmxMessage sends to all workers', async () => {
      const dir = createTeamDir();
      writeFileSync(join(dir, 'config.json'), JSON.stringify({
        name: teamName,
        workers: [
          { name: 'w1', index: 0, role: 'executor', assigned_tasks: [] },
          { name: 'w2', index: 1, role: 'executor', assigned_tasks: [] },
          { name: 'w3', index: 2, role: 'executor', assigned_tasks: [] },
        ],
      }));
      const messages = await broadcastOmxMessage(teamName, 'w1', 'Broadcast', testDir);
      expect(messages).toHaveLength(2);
    });
  });

  describe('task operations', () => {
    beforeEach(() => {
      createTeamDir();
      mkdirSync(join(testDir, '.omx', 'state', 'team', teamName, 'tasks'), { recursive: true });
    });

    it('readOmxTask returns null for non-existent task', async () => {
      expect(await readOmxTask(teamName, '1', testDir)).toBeNull();
    });

    it('listOmxTasks returns empty array', async () => {
      expect(await listOmxTasks(teamName, testDir)).toEqual([]);
    });

    it('reads task file', async () => {
      const taskPath = join(testDir, '.omx', 'state', 'team', teamName, 'tasks', 'task-1.json');
      writeFileSync(taskPath, JSON.stringify({
        id: '1',
        subject: 'Test',
        description: 'Test task',
        status: 'pending',
        created_at: '2026-01-01T00:00:00Z',
      }));
      const task = await readOmxTask(teamName, '1', testDir);
      expect(task?.subject).toBe('Test');
    });
  });

  describe('appendOmxTeamEvent', () => {
    it('creates event with generated fields', async () => {
      createTeamDir();
      const event = await appendOmxTeamEvent(teamName, {
        type: 'task_completed',
        worker: 'w1',
        task_id: '1',
      }, testDir);
      expect(event.event_id).toBeDefined();
      expect(event.team).toBe(teamName);
      expect(event.created_at).toBeDefined();
    });
  });
});

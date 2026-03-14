import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  initInteropSession,
  readInteropConfig,
  addSharedTask,
  readSharedTasks,
  updateSharedTask,
  addSharedMessage,
  readSharedMessages,
  markMessageAsRead,
  cleanupInterop,
} from '../shared-state.js';

describe('Shared State', () => {
  const testDir = join(process.cwd(), '.test-interop');

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
  });

  describe('initInteropSession', () => {
    it('creates config with required fields', () => {
      const config = initInteropSession('test-session', testDir);
      expect(config.sessionId).toBe('test-session');
      expect(config.omcCwd).toBe(testDir);
      expect(config.status).toBe('active');
      expect(config.createdAt).toBeDefined();
    });

    it('persists config to disk', () => {
      initInteropSession('test-session', testDir);
      const read = readInteropConfig(testDir);
      expect(read?.sessionId).toBe('test-session');
    });
  });

  describe('readInteropConfig', () => {
    it('returns null when config does not exist', () => {
      expect(readInteropConfig(testDir)).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      const interopDir = join(testDir, '.omc', 'state', 'interop');
      mkdirSync(interopDir, { recursive: true });
      require('fs').writeFileSync(join(interopDir, 'config.json'), 'invalid');
      expect(readInteropConfig(testDir)).toBeNull();
    });
  });

  describe('addSharedTask', () => {
    it('creates task with generated id', () => {
      const task = addSharedTask(testDir, {
        source: 'omc',
        target: 'omx',
        type: 'implement',
        description: 'Test task',
      });
      expect(task.id).toMatch(/^task-/);
      expect(task.status).toBe('pending');
    });

    it('includes optional fields', () => {
      const task = addSharedTask(testDir, {
        source: 'omc',
        target: 'omx',
        type: 'review',
        description: 'Review code',
        files: ['test.ts'],
        context: { key: 'value' },
      });
      expect(task.files).toEqual(['test.ts']);
      expect(task.context).toEqual({ key: 'value' });
    });
  });

  describe('readSharedTasks', () => {
    it('returns empty array when no tasks exist', () => {
      expect(readSharedTasks(testDir)).toEqual([]);
    });

    it('filters by source', () => {
      addSharedTask(testDir, { source: 'omc', target: 'omx', type: 'test', description: 'A' });
      addSharedTask(testDir, { source: 'omx', target: 'omc', type: 'test', description: 'B' });
      const tasks = readSharedTasks(testDir, { source: 'omc' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].description).toBe('A');
    });

    it('filters by status', () => {
      const task = addSharedTask(testDir, { source: 'omc', target: 'omx', type: 'test', description: 'A' });
      updateSharedTask(testDir, task.id, { status: 'completed' });
      expect(readSharedTasks(testDir, { status: 'pending' })).toHaveLength(0);
      expect(readSharedTasks(testDir, { status: 'completed' })).toHaveLength(1);
    });
  });

  describe('updateSharedTask', () => {
    it('returns null for non-existent task', () => {
      expect(updateSharedTask(testDir, 'fake-id', { status: 'completed' })).toBeNull();
    });

    it('updates task fields', () => {
      const task = addSharedTask(testDir, { source: 'omc', target: 'omx', type: 'test', description: 'A' });
      const updated = updateSharedTask(testDir, task.id, { status: 'in_progress', result: 'Done' });
      expect(updated?.status).toBe('in_progress');
      expect(updated?.result).toBe('Done');
    });

    it('sets completedAt when status is completed', () => {
      const task = addSharedTask(testDir, { source: 'omc', target: 'omx', type: 'test', description: 'A' });
      const updated = updateSharedTask(testDir, task.id, { status: 'completed' });
      expect(updated?.completedAt).toBeDefined();
    });
  });

  describe('addSharedMessage', () => {
    it('creates message with generated id', () => {
      const msg = addSharedMessage(testDir, {
        source: 'omc',
        target: 'omx',
        content: 'Hello',
      });
      expect(msg.id).toMatch(/^msg-/);
      expect(msg.read).toBe(false);
    });
  });

  describe('readSharedMessages', () => {
    it('returns empty array when no messages exist', () => {
      expect(readSharedMessages(testDir)).toEqual([]);
    });

    it('filters by unreadOnly', () => {
      const msg = addSharedMessage(testDir, { source: 'omc', target: 'omx', content: 'A' });
      markMessageAsRead(testDir, msg.id);
      expect(readSharedMessages(testDir, { unreadOnly: true })).toHaveLength(0);
      expect(readSharedMessages(testDir, { unreadOnly: false })).toHaveLength(1);
    });
  });

  describe('markMessageAsRead', () => {
    it('returns false for non-existent message', () => {
      expect(markMessageAsRead(testDir, 'fake-id')).toBe(false);
    });

    it('marks message as read', () => {
      const msg = addSharedMessage(testDir, { source: 'omc', target: 'omx', content: 'A' });
      expect(markMessageAsRead(testDir, msg.id)).toBe(true);
      const messages = readSharedMessages(testDir);
      expect(messages[0].read).toBe(true);
    });
  });

  describe('cleanupInterop', () => {
    it('deletes all tasks and messages by default', () => {
      addSharedTask(testDir, { source: 'omc', target: 'omx', type: 'test', description: 'A' });
      addSharedMessage(testDir, { source: 'omc', target: 'omx', content: 'B' });
      const result = cleanupInterop(testDir);
      expect(result.tasksDeleted).toBe(1);
      expect(result.messagesDeleted).toBe(1);
    });

    it('respects keepTasks option', () => {
      addSharedTask(testDir, { source: 'omc', target: 'omx', type: 'test', description: 'A' });
      const result = cleanupInterop(testDir, { keepTasks: true });
      expect(result.tasksDeleted).toBe(0);
    });

    it('deletes only old items when olderThan specified', () => {
      addSharedTask(testDir, { source: 'omc', target: 'omx', type: 'test', description: 'A' });
      const result = cleanupInterop(testDir, { olderThan: 1000 * 60 * 60 });
      expect(result.tasksDeleted).toBe(0);
    });
  });
});

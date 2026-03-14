import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  readUltrapilotState,
  writeUltrapilotState,
  clearUltrapilotState,
  isUltrapilotActive,
  initUltrapilot,
  updateWorkerState,
  addWorker,
  completeWorker,
  failWorker,
  completeUltrapilot,
  getCompletedWorkers,
  getRunningWorkers,
  getFailedWorkers,
  recordConflict
} from '../state.js';
import type { WorkerState } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

describe('ultrapilot state', () => {
  const testDir = path.join(process.cwd(), '.test-ultrapilot-state');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('initUltrapilot', () => {
    it('初始化新会话', async () => {
      const state = await initUltrapilot(testDir, 'test task', ['t1', 't2']);
      expect(state).toBeTruthy();
      expect(state!.active).toBe(true);
      expect(state!.originalTask).toBe('test task');
      expect(state!.subtasks).toEqual(['t1', 't2']);
    });

    it('设置默认所有权', async () => {
      const state = await initUltrapilot(testDir, 'task', ['t1']);
      expect(state!.ownership.coordinator).toBeDefined();
      expect(state!.ownership.workers).toEqual({});
      expect(state!.ownership.conflicts).toEqual([]);
    });

    it('支持会话 ID', async () => {
      const state = await initUltrapilot(testDir, 'task', ['t1'], 'session-123');
      expect(state!.sessionId).toBe('session-123');
    });
  });

  describe('readUltrapilotState', () => {
    it('不存在时返回 null', () => {
      const state = readUltrapilotState(testDir);
      expect(state).toBeNull();
    });

    it('读取已写入的状态', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const state = readUltrapilotState(testDir);
      expect(state).toBeTruthy();
      expect(state!.originalTask).toBe('task');
    });
  });

  describe('writeUltrapilotState', () => {
    it('写入状态到磁盘', async () => {
      const state = await initUltrapilot(testDir, 'task', ['t1']);
      const success = await writeUltrapilotState(testDir, state!);
      expect(success).toBe(true);
    });
  });

  describe('clearUltrapilotState', () => {
    it('清除状态文件', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const cleared = clearUltrapilotState(testDir);
      expect(cleared).toBe(true);
      expect(readUltrapilotState(testDir)).toBeNull();
    });
  });

  describe('isUltrapilotActive', () => {
    it('无状态时返回 false', () => {
      expect(isUltrapilotActive(testDir)).toBe(false);
    });

    it('有活动状态时返回 true', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      expect(isUltrapilotActive(testDir)).toBe(true);
    });

    it('完成后返回 false', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      await completeUltrapilot(testDir);
      expect(isUltrapilotActive(testDir)).toBe(false);
    });
  });

  describe('addWorker', () => {
    it('添加新 worker', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const worker: WorkerState = {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: ['a.ts'],
        status: 'pending',
        startedAt: new Date().toISOString(),
        filesCreated: [],
        filesModified: []
      };
      const success = await addWorker(testDir, worker);
      expect(success).toBe(true);

      const state = readUltrapilotState(testDir);
      expect(state!.workers).toHaveLength(1);
      expect(state!.totalWorkersSpawned).toBe(1);
    });
  });

  describe('updateWorkerState', () => {
    it('更新 worker 状态', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const worker: WorkerState = {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: [],
        status: 'pending',
        startedAt: new Date().toISOString(),
        filesCreated: [],
        filesModified: []
      };
      await addWorker(testDir, worker);

      const success = await updateWorkerState(testDir, 'w1', { status: 'running' });
      expect(success).toBe(true);

      const state = readUltrapilotState(testDir);
      expect(state!.workers[0].status).toBe('running');
    });

    it('worker 不存在时返回 false', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const success = await updateWorkerState(testDir, 'nonexistent', { status: 'running' });
      expect(success).toBe(false);
    });
  });

  describe('completeWorker', () => {
    it('标记 worker 为完成', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const worker: WorkerState = {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: [],
        status: 'running',
        startedAt: new Date().toISOString(),
        filesCreated: [],
        filesModified: []
      };
      await addWorker(testDir, worker);

      const success = await completeWorker(testDir, 'w1', ['new.ts'], ['mod.ts']);
      expect(success).toBe(true);

      const state = readUltrapilotState(testDir);
      expect(state!.workers[0].status).toBe('complete');
      expect(state!.workers[0].filesCreated).toEqual(['new.ts']);
      expect(state!.workers[0].filesModified).toEqual(['mod.ts']);
      expect(state!.successfulWorkers).toBe(1);
    });
  });

  describe('failWorker', () => {
    it('标记 worker 为失败', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const worker: WorkerState = {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: [],
        status: 'running',
        startedAt: new Date().toISOString(),
        filesCreated: [],
        filesModified: []
      };
      await addWorker(testDir, worker);

      const success = await failWorker(testDir, 'w1', 'Test error');
      expect(success).toBe(true);

      const state = readUltrapilotState(testDir);
      expect(state!.workers[0].status).toBe('failed');
      expect(state!.workers[0].error).toBe('Test error');
      expect(state!.failedWorkers).toBe(1);
    });
  });

  describe('getCompletedWorkers', () => {
    it('返回已完成的 workers', async () => {
      await initUltrapilot(testDir, 'task', ['t1', 't2']);
      await addWorker(testDir, {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: [],
        status: 'complete',
        startedAt: '',
        filesCreated: [],
        filesModified: []
      });
      await addWorker(testDir, {
        id: 'w2',
        index: 1,
        task: 't2',
        ownedFiles: [],
        status: 'running',
        startedAt: '',
        filesCreated: [],
        filesModified: []
      });

      const completed = getCompletedWorkers(testDir);
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('w1');
    });
  });

  describe('getRunningWorkers', () => {
    it('返回运行中的 workers', async () => {
      await initUltrapilot(testDir, 'task', ['t1', 't2']);
      await addWorker(testDir, {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: [],
        status: 'running',
        startedAt: '',
        filesCreated: [],
        filesModified: []
      });

      const running = getRunningWorkers(testDir);
      expect(running).toHaveLength(1);
      expect(running[0].id).toBe('w1');
    });
  });

  describe('getFailedWorkers', () => {
    it('返回失败的 workers', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      await addWorker(testDir, {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: [],
        status: 'failed',
        startedAt: '',
        filesCreated: [],
        filesModified: [],
        error: 'Failed'
      });

      const failed = getFailedWorkers(testDir);
      expect(failed).toHaveLength(1);
      expect(failed[0].id).toBe('w1');
    });
  });

  describe('recordConflict', () => {
    it('记录文件冲突', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const success = await recordConflict(testDir, 'conflict.ts');
      expect(success).toBe(true);

      const state = readUltrapilotState(testDir);
      expect(state!.ownership.conflicts).toContain('conflict.ts');
    });

    it('避免重复记录', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      await recordConflict(testDir, 'conflict.ts');
      await recordConflict(testDir, 'conflict.ts');

      const state = readUltrapilotState(testDir);
      expect(state!.ownership.conflicts.filter(f => f === 'conflict.ts')).toHaveLength(1);
    });
  });

  describe('completeUltrapilot', () => {
    it('标记会话为完成', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const success = await completeUltrapilot(testDir);
      expect(success).toBe(true);

      const state = readUltrapilotState(testDir);
      expect(state!.active).toBe(false);
      expect(state!.completedAt).toBeTruthy();
    });
  });
});

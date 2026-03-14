import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  startUltrapilot,
  decomposeTask,
  spawnWorkers,
  trackProgress,
  integrateResults,
  handleSharedFiles,
  isFileOwnedByWorker,
  isSharedFile,
  assignFileToWorker,
  DEFAULT_CONFIG
} from '../index.js';
import { initUltrapilot, addWorker, completeWorker, failWorker } from '../state.js';
import type { WorkerState } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

describe('ultrapilot index', () => {
  const testDir = path.join(process.cwd(), '.test-ultrapilot-index');

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

  describe('startUltrapilot', () => {
    it('启动新会话', async () => {
      const state = await startUltrapilot(testDir, '1. Task A\n2. Task B');
      expect(state.active).toBe(true);
      expect(state.subtasks.length).toBeGreaterThan(0);
    });

    it('应用自定义配置', async () => {
      const state = await startUltrapilot(testDir, 'task', { maxWorkers: 2 });
      expect(state.maxIterations).toBe(DEFAULT_CONFIG.maxIterations);
    });
  });

  describe('decomposeTask', () => {
    it('分解编号列表', async () => {
      const subtasks = await decomposeTask('1. A\n2. B\n3. C', DEFAULT_CONFIG);
      expect(subtasks).toEqual(['A', 'B', 'C']);
    });

    it('分解项目符号列表', async () => {
      const subtasks = await decomposeTask('- A\n- B', DEFAULT_CONFIG);
      expect(subtasks.length).toBeGreaterThan(0);
    });

    it('限制到 maxWorkers', async () => {
      const task = Array.from({ length: 30 }, (_, i) => `${i + 1}. T${i}`).join('\n');
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);
      expect(subtasks.length).toBeLessThanOrEqual(DEFAULT_CONFIG.maxWorkers);
    });

    it('处理句子分隔', async () => {
      const subtasks = await decomposeTask('Implement feature A. Implement feature B. Implement feature C.', DEFAULT_CONFIG);
      expect(subtasks.length).toBeGreaterThanOrEqual(3);
    });

    it('过滤短片段', async () => {
      const subtasks = await decomposeTask('A. B. Implement feature.', DEFAULT_CONFIG);
      expect(subtasks.every(s => s.length > 10)).toBe(true);
    });

    it('单任务时返回原任务', async () => {
      const subtasks = await decomposeTask('Single task', DEFAULT_CONFIG);
      expect(subtasks).toEqual(['Single task']);
    });
  });

  describe('spawnWorkers', () => {
    it('为子任务生成 workers', async () => {
      await initUltrapilot(testDir, 'task', ['t1', 't2']);
      const workers = await spawnWorkers(testDir, ['t1', 't2']);
      expect(workers).toHaveLength(2);
      expect(workers[0].id).toBe('worker-1');
      expect(workers[1].id).toBe('worker-2');
    });

    it('未初始化时抛出错误', async () => {
      await expect(spawnWorkers(testDir, ['t1'])).rejects.toThrow('not initialized');
    });
  });

  describe('trackProgress', () => {
    it('跟踪 worker 进度', async () => {
      await initUltrapilot(testDir, 'task', ['t1', 't2', 't3']);

      // Add workers sequentially and wait for each write
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

      await addWorker(testDir, {
        id: 'w3',
        index: 2,
        task: 't3',
        ownedFiles: [],
        status: 'failed',
        startedAt: '',
        filesCreated: [],
        filesModified: [],
        error: 'err'
      });

      // Small delay to ensure file system sync in CI
      await new Promise(resolve => setTimeout(resolve, 100));

      const progress = await trackProgress(testDir);
      expect(progress.completed).toBe(1);
      expect(progress.running).toBe(1);
      expect(progress.failed).toBe(1);
      expect(progress.total).toBe(3);
    });

    it('无状态时返回零', async () => {
      const progress = await trackProgress(testDir);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
    });
  });

  describe('integrateResults', () => {
    it('集成成功的 workers', async () => {
      await initUltrapilot(testDir, 'task', ['t1', 't2']);
      await addWorker(testDir, {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: [],
        status: 'complete',
        startedAt: '',
        filesCreated: ['a.ts'],
        filesModified: ['b.ts']
      });
      await addWorker(testDir, {
        id: 'w2',
        index: 1,
        task: 't2',
        ownedFiles: [],
        status: 'complete',
        startedAt: '',
        filesCreated: ['c.ts'],
        filesModified: []
      });

      const result = await integrateResults(testDir);
      expect(result.success).toBe(true);
      expect(result.filesCreated).toContain('a.ts');
      expect(result.filesCreated).toContain('c.ts');
      expect(result.filesModified).toContain('b.ts');
    });

    it('检测文件冲突', async () => {
      await initUltrapilot(testDir, 'task', ['t1', 't2']);
      await addWorker(testDir, {
        id: 'w1',
        index: 0,
        task: 't1',
        ownedFiles: [],
        status: 'complete',
        startedAt: '',
        filesCreated: [],
        filesModified: ['shared.ts']
      });
      await addWorker(testDir, {
        id: 'w2',
        index: 1,
        task: 't2',
        ownedFiles: [],
        status: 'complete',
        startedAt: '',
        filesCreated: [],
        filesModified: ['shared.ts']
      });

      const result = await integrateResults(testDir);
      expect(result.success).toBe(false);
      expect(result.conflicts).toContain('shared.ts');
    });

    it('收集失败 worker 的错误', async () => {
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
        error: 'Test error'
      });

      const result = await integrateResults(testDir);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Test error'))).toBe(true);
    });

    it('生成摘要', async () => {
      await initUltrapilot(testDir, 'Original task', ['t1']);
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

      const result = await integrateResults(testDir);
      expect(result.summary).toContain('Original task');
      expect(result.summary).toContain('Completed: 1');
    });
  });

  describe('handleSharedFiles', () => {
    it('标记文件为共享', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const success = await handleSharedFiles(testDir, ['package.json']);
      expect(success).toBe(true);
      expect(isSharedFile(testDir, 'package.json')).toBe(true);
    });
  });

  describe('isSharedFile', () => {
    it('检测共享文件', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      await handleSharedFiles(testDir, ['shared.ts']);
      expect(isSharedFile(testDir, 'shared.ts')).toBe(true);
      expect(isSharedFile(testDir, 'other.ts')).toBe(false);
    });
  });

  describe('isFileOwnedByWorker', () => {
    it('检测 worker 文件所有权', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      await assignFileToWorker(testDir, 'w1', 'owned.ts');
      expect(isFileOwnedByWorker(testDir, 'w1', 'owned.ts')).toBe(true);
      expect(isFileOwnedByWorker(testDir, 'w2', 'owned.ts')).toBe(false);
    });
  });

  describe('assignFileToWorker', () => {
    it('分配文件给 worker', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      const success = await assignFileToWorker(testDir, 'w1', 'file.ts');
      expect(success).toBe(true);
      expect(isFileOwnedByWorker(testDir, 'w1', 'file.ts')).toBe(true);
    });

    it('防止重复分配', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      await assignFileToWorker(testDir, 'w1', 'file.ts');
      const success = await assignFileToWorker(testDir, 'w2', 'file.ts');
      expect(success).toBe(false);
    });

    it('防止分配共享文件', async () => {
      await initUltrapilot(testDir, 'task', ['t1']);
      await handleSharedFiles(testDir, ['shared.ts']);
      const success = await assignFileToWorker(testDir, 'w1', 'shared.ts');
      expect(success).toBe(false);
    });
  });
});

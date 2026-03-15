import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { decomposeTask, DEFAULT_CONFIG, assignFileToWorker, isSharedFile, handleSharedFiles, startUltrapilot, integrateResults } from '../index.js';
import { writeUltrapilotState, initUltrapilot } from '../state.js';
import * as fs from 'fs';
import * as path from 'path';

describe('ultrapilot coordinator', () => {
  describe('task decomposition', () => {
    it('should decompose numbered list', async () => {
      const task = '1. Add tests\n2. Fix bugs\n3. Update docs';
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);

      expect(subtasks).toHaveLength(3);
      expect(subtasks[0]).toBe('Add tests');
      expect(subtasks[1]).toBe('Fix bugs');
      expect(subtasks[2]).toBe('Update docs');
    });

    it('should decompose bulleted list', async () => {
      const task = '- Implement feature A\n- Implement feature B';
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);

      expect(subtasks.length).toBeGreaterThan(0);
      expect(subtasks[0]).toContain('feature');
    });

    it('should limit to maxWorkers', async () => {
      const task = Array.from({ length: 30 }, (_, i) => `${i + 1}. Task ${i}`).join('\n');
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);

      expect(subtasks.length).toBeLessThanOrEqual(DEFAULT_CONFIG.maxWorkers);
    });

    it('should handle single task without list', async () => {
      const task = 'Implement authentication system';
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);

      expect(subtasks.length).toBeGreaterThan(0);
    });

    it('should handle sentence-based decomposition', async () => {
      const task = 'Add user login. Implement password reset. Create profile page.';
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);

      expect(subtasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should merge custom config with defaults', async () => {
      const task = '1. Task A\n2. Task B\n3. Task C';
      const customConfig = { maxWorkers: 2 };
      const subtasks = await decomposeTask(task, { ...DEFAULT_CONFIG, ...customConfig });

      expect(subtasks).toHaveLength(2);
    });

    it('should handle empty input gracefully', async () => {
      const task = '';
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);

      expect(subtasks).toHaveLength(1);
      expect(subtasks[0]).toBe('');
    });

    it('should handle mixed list formats', async () => {
      const task = '1. First task\n- Second task\n* Third task\n+ Fourth task';
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);

      expect(subtasks.length).toBeGreaterThanOrEqual(4);
      expect(subtasks[0]).toBe('First task');
    });

    it('should filter out very short fragments', async () => {
      const task = 'Do this. A. B. Implement feature properly.';
      const subtasks = await decomposeTask(task, DEFAULT_CONFIG);

      expect(subtasks.every(s => s.length > 10)).toBe(true);
    });
  });

  describe('file ownership', () => {
    const testDir = path.join(process.cwd(), '.test-ultrapilot-ownership');

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

    it('should prevent file ownership conflicts', async () => {
      const state = await initUltrapilot(testDir, 'test task', ['task1', 'task2']);
      expect(state).toBeTruthy();

      const success1 = await assignFileToWorker(testDir, 'worker-1', 'file.ts');
      expect(success1).toBe(true);

      const success2 = await assignFileToWorker(testDir, 'worker-2', 'file.ts');
      expect(success2).toBe(false);
    });

    it('should track shared files correctly', async () => {
      const state = await initUltrapilot(testDir, 'test task', ['task1']);
      expect(state).toBeTruthy();

      const result = await handleSharedFiles(testDir, ['package.json']);
      console.log('handleSharedFiles result:', result);

      const isShared = isSharedFile(testDir, 'package.json');
      console.log('isSharedFile result:', isShared);

      expect(isShared).toBe(true);
      expect(await assignFileToWorker(testDir, 'worker-1', 'package.json')).toBe(false);
    });
  });

  describe('parallel coordination', () => {
    const testDir = path.join(process.cwd(), '.test-ultrapilot-parallel');

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

    it('should initialize state with subtasks', async () => {
      const state = await startUltrapilot(testDir, '1. Task A\n2. Task B\n3. Task C');

      expect(state.active).toBe(true);
      expect(state.subtasks).toHaveLength(3);
      expect(state.originalTask).toContain('Task A');
    });

    it.skipIf(process.platform === 'win32')('should detect conflicts during integration', async () => {
      const state = initUltrapilot(testDir, 'test', ['t1', 't2']);
      if (!state) throw new Error('Init failed');

      state.workers = [
        { id: 'w1', index: 0, task: 't1', ownedFiles: [], status: 'complete', filesCreated: [], filesModified: ['shared.ts'], startedAt: '' },
        { id: 'w2', index: 1, task: 't2', ownedFiles: [], status: 'complete', filesCreated: [], filesModified: ['shared.ts'], startedAt: '' }
      ];
      await writeUltrapilotState(testDir, state);

      const result = await integrateResults(testDir);
      expect(result.conflicts).toContain('shared.ts');
      expect(result.success).toBe(false);
    });
  });
});

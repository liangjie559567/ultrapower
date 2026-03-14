import { describe, it, expect } from 'vitest';
import {
  generateDecompositionPrompt,
  parseDecompositionResult,
  generateParallelGroups,
  validateFileOwnership,
  extractSharedFiles,
  toSimpleSubtasks,
  DEFAULT_SHARED_FILE_PATTERNS
} from '../decomposer.js';
import type { DecomposedTask, DecompositionResult } from '../decomposer.js';

describe('decomposer', () => {
  describe('generateDecompositionPrompt', () => {
    it('生成包含任务和上下文的提示词', () => {
      const prompt = generateDecompositionPrompt('Build API', 'src/api exists');
      expect(prompt).toContain('Build API');
      expect(prompt).toContain('src/api exists');
      expect(prompt).toContain('subtasks');
    });

    it('应用最大子任务数限制', () => {
      const prompt = generateDecompositionPrompt('Task', 'Context', { maxSubtasks: 3 });
      expect(prompt).toContain('Maximum 3 subtasks');
    });

    it('包含首选模型配置', () => {
      const prompt = generateDecompositionPrompt('Task', 'Context', { preferredModel: 'opus' });
      expect(prompt).toContain('Preferred model tier: opus');
    });

    it('添加项目上下文', () => {
      const prompt = generateDecompositionPrompt('Task', 'Context', { projectContext: 'Uses React' });
      expect(prompt).toContain('Uses React');
    });
  });

  describe('parseDecompositionResult', () => {
    it('解析有效 JSON 响应', () => {
      const response = JSON.stringify({
        subtasks: [
          { id: '1', description: 'Task 1', files: ['a.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' }
        ],
        sharedFiles: ['package.json'],
        parallelGroups: [['1']]
      });
      const result = parseDecompositionResult(response);
      expect(result.subtasks).toHaveLength(1);
      expect(result.subtasks[0].id).toBe('1');
    });

    it('解析 markdown 代码块中的 JSON', () => {
      const response = '```json\n{"subtasks":[{"id":"1","description":"T","files":[],"blockedBy":[],"agentType":"executor","model":"sonnet"}],"sharedFiles":[],"parallelGroups":[[]]}\n```';
      const result = parseDecompositionResult(response);
      expect(result.subtasks).toHaveLength(1);
    });

    it('为缺失的 blockedBy 设置默认值', () => {
      const response = '{"subtasks":[{"id":"1","description":"T","files":[]}],"sharedFiles":[],"parallelGroups":[[]]}';
      const result = parseDecompositionResult(response);
      expect(result.subtasks[0].blockedBy).toEqual([]);
    });

    it('为无效 agentType 设置默认值', () => {
      const response = '{"subtasks":[{"id":"1","description":"T","files":[],"blockedBy":[],"agentType":"invalid"}],"sharedFiles":[],"parallelGroups":[[]]}';
      const result = parseDecompositionResult(response);
      expect(result.subtasks[0].agentType).toBe('executor');
    });

    it('为无效 model 设置默认值', () => {
      const response = '{"subtasks":[{"id":"1","description":"T","files":[],"blockedBy":[],"model":"invalid"}],"sharedFiles":[],"parallelGroups":[[]]}';
      const result = parseDecompositionResult(response);
      expect(result.subtasks[0].model).toBe('sonnet');
    });

    it('生成缺失的 parallelGroups', () => {
      const response = '{"subtasks":[{"id":"1","description":"T","files":[],"blockedBy":[]}]}';
      const result = parseDecompositionResult(response);
      expect(result.parallelGroups).toBeDefined();
    });

    it('拒绝无效 JSON', () => {
      expect(() => parseDecompositionResult('not json')).toThrow();
    });

    it('拒绝缺少 subtasks 的响应', () => {
      expect(() => parseDecompositionResult('{}')).toThrow('missing or invalid subtasks');
    });

    it('拒绝无效的子任务对象', () => {
      expect(() => parseDecompositionResult('{"subtasks":[null]}')).toThrow('invalid subtask');
    });

    it('拒绝缺少 id 的子任务', () => {
      expect(() => parseDecompositionResult('{"subtasks":[{"description":"T"}]}')).toThrow('missing id');
    });

    it('拒绝缺少 description 的子任务', () => {
      expect(() => parseDecompositionResult('{"subtasks":[{"id":"1"}]}')).toThrow('missing description');
    });

    it('拒绝缺少 files 的子任务', () => {
      expect(() => parseDecompositionResult('{"subtasks":[{"id":"1","description":"T"}]}')).toThrow('missing files');
    });
  });

  describe('generateParallelGroups', () => {
    it('无依赖时生成单组', () => {
      const subtasks: DecomposedTask[] = [
        { id: '1', description: 'T1', files: [], blockedBy: [], agentType: 'executor', model: 'sonnet' },
        { id: '2', description: 'T2', files: [], blockedBy: [], agentType: 'executor', model: 'sonnet' }
      ];
      const groups = generateParallelGroups(subtasks);
      expect(groups).toEqual([['1', '2']]);
    });

    it('有依赖时生成多组', () => {
      const subtasks: DecomposedTask[] = [
        { id: '1', description: 'T1', files: [], blockedBy: [], agentType: 'executor', model: 'sonnet' },
        { id: '2', description: 'T2', files: [], blockedBy: ['1'], agentType: 'executor', model: 'sonnet' }
      ];
      const groups = generateParallelGroups(subtasks);
      expect(groups).toEqual([['1'], ['2']]);
    });

    it('检测循环依赖', () => {
      const subtasks: DecomposedTask[] = [
        { id: '1', description: 'T1', files: [], blockedBy: ['2'], agentType: 'executor', model: 'sonnet' },
        { id: '2', description: 'T2', files: [], blockedBy: ['1'], agentType: 'executor', model: 'sonnet' }
      ];
      const groups = generateParallelGroups(subtasks);
      expect(groups.length).toBeGreaterThan(0);
    });

    it('处理复杂依赖链', () => {
      const subtasks: DecomposedTask[] = [
        { id: '1', description: 'T1', files: [], blockedBy: [], agentType: 'executor', model: 'sonnet' },
        { id: '2', description: 'T2', files: [], blockedBy: [], agentType: 'executor', model: 'sonnet' },
        { id: '3', description: 'T3', files: [], blockedBy: ['1', '2'], agentType: 'executor', model: 'sonnet' }
      ];
      const groups = generateParallelGroups(subtasks);
      expect(groups).toEqual([['1', '2'], ['3']]);
    });
  });

  describe('validateFileOwnership', () => {
    it('无冲突时验证通过', () => {
      const subtasks: DecomposedTask[] = [
        { id: '1', description: 'T1', files: ['a.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' },
        { id: '2', description: 'T2', files: ['b.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' }
      ];
      const result = validateFileOwnership(subtasks);
      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('检测文件冲突', () => {
      const subtasks: DecomposedTask[] = [
        { id: '1', description: 'T1', files: ['shared.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' },
        { id: '2', description: 'T2', files: ['shared.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' }
      ];
      const result = validateFileOwnership(subtasks);
      expect(result.isValid).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].file).toBe('shared.ts');
      expect(result.conflicts[0].owners).toEqual(['1', '2']);
    });

    it('检测多文件冲突', () => {
      const subtasks: DecomposedTask[] = [
        { id: '1', description: 'T1', files: ['a.ts', 'b.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' },
        { id: '2', description: 'T2', files: ['b.ts', 'c.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' }
      ];
      const result = validateFileOwnership(subtasks);
      expect(result.isValid).toBe(false);
      expect(result.conflicts.some(c => c.file === 'b.ts')).toBe(true);
    });
  });

  describe('extractSharedFiles', () => {
    it('提取共享文件', () => {
      const input: DecompositionResult = {
        subtasks: [
          { id: '1', description: 'T1', files: ['package.json', 'src/a.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' }
        ],
        sharedFiles: [],
        parallelGroups: [['1']]
      };
      const result = extractSharedFiles(input);
      expect(result.sharedFiles).toContain('package.json');
      expect(result.subtasks[0].files).not.toContain('package.json');
      expect(result.subtasks[0].files).toContain('src/a.ts');
    });

    it('使用自定义模式', () => {
      const input: DecompositionResult = {
        subtasks: [
          { id: '1', description: 'T1', files: ['custom.lock'], blockedBy: [], agentType: 'executor', model: 'sonnet' }
        ],
        sharedFiles: [],
        parallelGroups: [['1']]
      };
      const result = extractSharedFiles(input, ['custom.lock']);
      expect(result.sharedFiles).toContain('custom.lock');
    });

    it('匹配通配符模式', () => {
      const input: DecompositionResult = {
        subtasks: [
          { id: '1', description: 'T1', files: ['tsconfig.base.json'], blockedBy: [], agentType: 'executor', model: 'sonnet' }
        ],
        sharedFiles: [],
        parallelGroups: [['1']]
      };
      const result = extractSharedFiles(input, ['tsconfig.*.json']);
      expect(result.sharedFiles).toContain('tsconfig.base.json');
    });

    it('保留现有 sharedFiles', () => {
      const input: DecompositionResult = {
        subtasks: [
          { id: '1', description: 'T1', files: ['a.ts'], blockedBy: [], agentType: 'executor', model: 'sonnet' }
        ],
        sharedFiles: ['existing.json'],
        parallelGroups: [['1']]
      };
      const result = extractSharedFiles(input);
      expect(result.sharedFiles).toContain('existing.json');
    });
  });

  describe('toSimpleSubtasks', () => {
    it('转换为简单字符串数组', () => {
      const input: DecompositionResult = {
        subtasks: [
          { id: '1', description: 'Task 1', files: [], blockedBy: [], agentType: 'executor', model: 'sonnet' },
          { id: '2', description: 'Task 2', files: [], blockedBy: [], agentType: 'executor', model: 'sonnet' }
        ],
        sharedFiles: [],
        parallelGroups: [['1', '2']]
      };
      const result = toSimpleSubtasks(input);
      expect(result).toEqual(['Task 1', 'Task 2']);
    });
  });

  describe('DEFAULT_SHARED_FILE_PATTERNS', () => {
    it('包含常见配置文件', () => {
      expect(DEFAULT_SHARED_FILE_PATTERNS).toContain('package.json');
      expect(DEFAULT_SHARED_FILE_PATTERNS).toContain('tsconfig.json');
      expect(DEFAULT_SHARED_FILE_PATTERNS).toContain('Dockerfile');
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  projectMemoryReadTool,
  projectMemoryWriteTool,
  projectMemoryAddNoteTool,
  projectMemoryAddDirectiveTool,
} from '../memory-tools.js';
import type { ProjectMemory } from '../../hooks/project-memory/types.js';

let TEST_DIR: string;

vi.mock('../../lib/worktree-paths.js', async () => {
  const actual = await vi.importActual('../../lib/worktree-paths.js');
  return {
    ...actual,
    validateWorkingDirectory: vi.fn((workingDirectory?: string) => {
      return workingDirectory || process.cwd();
    }),
  };
});

const createMockMemory = (): ProjectMemory => ({
  version: '1.0.0',
  lastScanned: Date.now(),
  projectRoot: TEST_DIR,
  techStack: {
    languages: [{ name: 'TypeScript', version: '5.0.0', confidence: 'high', markers: ['tsconfig.json'] }],
    frameworks: [{ name: 'Vitest', version: '1.0.0', category: 'testing' }],
    packageManager: 'npm',
    runtime: 'node',
  },
  build: {
    buildCommand: 'npm run build',
    testCommand: 'npm test',
    lintCommand: 'npm run lint',
    devCommand: 'npm run dev',
    scripts: {},
  },
  conventions: {
    namingStyle: 'camelCase',
    importStyle: 'esm',
    testPattern: '*.test.ts',
    fileOrganization: 'feature-based',
  },
  structure: {
    isMonorepo: false,
    workspaces: [],
    mainDirectories: ['src', 'test'],
    gitBranches: { defaultBranch: 'main', branchingStrategy: 'trunk' },
  },
  customNotes: [],
  directoryMap: {},
  hotPaths: [],
  userDirectives: [],
});

describe('memory-tools', () => {
  beforeEach(() => {
    TEST_DIR = mkdtempSync(join(tmpdir(), 'memory-tools-test-'));
    mkdirSync(join(TEST_DIR, '.omc'), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('project_memory_read', () => {
    it('should return error when memory does not exist', async () => {
      const result = await projectMemoryReadTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('does not exist');
      expect(result.content[0].text).toContain('project-memory.json');
    });

    it('should read all sections when section is "all"', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryReadTool.handler({
        section: 'all',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Project Memory');
      expect(result.content[0].text).toContain('TypeScript');
      expect(result.content[0].text).toContain('npm run build');
    });

    it('should read techStack section', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryReadTool.handler({
        section: 'techStack',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('techStack');
      expect(result.content[0].text).toContain('TypeScript');
      expect(result.content[0].text).not.toContain('buildCommand');
    });

    it('should read build section', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryReadTool.handler({
        section: 'build',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('build');
      expect(result.content[0].text).toContain('npm run build');
    });

    it('should read conventions section', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryReadTool.handler({
        section: 'conventions',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('conventions');
      expect(result.content[0].text).toContain('camelCase');
    });

    it('should read structure section', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryReadTool.handler({
        section: 'structure',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('structure');
      expect(result.content[0].text).toContain('isMonorepo');
    });

    it('should read notes section', async () => {
      const memory = createMockMemory();
      memory.customNotes = [
        { timestamp: Date.now(), source: 'manual', category: 'build', content: 'Use pnpm' },
      ];
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryReadTool.handler({
        section: 'notes',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('notes');
      expect(result.content[0].text).toContain('Use pnpm');
    });

    it('should read directives section', async () => {
      const memory = createMockMemory();
      memory.userDirectives = [
        {
          timestamp: Date.now(),
          directive: 'Always use strict mode',
          context: 'TypeScript',
          source: 'explicit',
          priority: 'high',
        },
      ];
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryReadTool.handler({
        section: 'directives',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('directives');
      expect(result.content[0].text).toContain('Always use strict mode');
    });
  });

  describe('project_memory_write', () => {
    it('should write new memory when none exists', async () => {
      const memory = createMockMemory();

      const result = await projectMemoryWriteTool.handler({
        memory: memory as any,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');
      expect(result.content[0].text).toContain('project-memory.json');
    });

    it('should replace memory when merge is false', async () => {
      const oldMemory = createMockMemory();
      oldMemory.techStack.languages = [
        { name: 'JavaScript', version: null, confidence: 'high', markers: [] },
      ];
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(oldMemory, null, 2)
      );

      const newMemory = createMockMemory();
      newMemory.techStack.languages = [
        { name: 'TypeScript', version: '5.0.0', confidence: 'high', markers: [] },
      ];

      const result = await projectMemoryWriteTool.handler({
        memory: newMemory as any,
        merge: false,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');
    });

    it('should merge memory when merge is true', async () => {
      const oldMemory = createMockMemory();
      oldMemory.build.buildCommand = 'old-build';
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(oldMemory, null, 2)
      );

      const result = await projectMemoryWriteTool.handler({
        memory: { build: { testCommand: 'new-test' } } as any,
        merge: true,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully merged');
    });

    it('should add required fields if missing', async () => {
      const result = await projectMemoryWriteTool.handler({
        memory: { techStack: {} } as any,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');
    });
  });

  describe('project_memory_add_note', () => {
    it('should return error when memory does not exist', async () => {
      const result = await projectMemoryAddNoteTool.handler({
        category: 'build',
        content: 'Test note',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('does not exist');
    });

    it('should add note to existing memory', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryAddNoteTool.handler({
        category: 'build',
        content: 'Use pnpm instead of npm',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully added note');
      expect(result.content[0].text).toContain('build');
      expect(result.content[0].text).toContain('Use pnpm instead of npm');
    });

    it('should handle different note categories', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const categories = ['test', 'deploy', 'env', 'architecture'];
      for (const category of categories) {
        const result = await projectMemoryAddNoteTool.handler({
          category,
          content: `Note for ${category}`,
          workingDirectory: TEST_DIR,
        });

        expect(result.content[0].text).toContain('Successfully added note');
        expect(result.content[0].text).toContain(category);
      }
    });
  });

  describe('project_memory_add_directive', () => {
    it('should return error when memory does not exist', async () => {
      const result = await projectMemoryAddDirectiveTool.handler({
        directive: 'Always use strict mode',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('does not exist');
    });

    it('should add directive with default priority', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryAddDirectiveTool.handler({
        directive: 'Always use TypeScript strict mode',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully added directive');
      expect(result.content[0].text).toContain('Always use TypeScript strict mode');
      expect(result.content[0].text).toContain('normal');
    });

    it('should add directive with high priority', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryAddDirectiveTool.handler({
        directive: 'Never commit secrets',
        priority: 'high',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully added directive');
      expect(result.content[0].text).toContain('high');
    });

    it('should add directive with context', async () => {
      const memory = createMockMemory();
      writeFileSync(
        join(TEST_DIR, '.omc', 'project-memory.json'),
        JSON.stringify(memory, null, 2)
      );

      const result = await projectMemoryAddDirectiveTool.handler({
        directive: 'Use ESM imports',
        context: 'For all TypeScript files',
        priority: 'normal',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully added directive');
      expect(result.content[0].text).toContain('Use ESM imports');
      expect(result.content[0].text).toContain('For all TypeScript files');
    });
  });
});


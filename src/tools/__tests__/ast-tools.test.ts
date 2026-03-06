import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { astGrepSearchTool, astGrepReplaceTool, SUPPORTED_LANGUAGES } from '../ast-tools.js';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs');
vi.mock('path');

// Mock @ast-grep/napi module
const mockLangEnum = Symbol('javascript');
const mockSgModule = {
  Lang: {
    JavaScript: mockLangEnum,
    TypeScript: Symbol('typescript'),
    Tsx: Symbol('tsx'),
    Python: Symbol('python'),
    Ruby: Symbol('ruby'),
    Go: Symbol('go'),
    Rust: Symbol('rust'),
    Java: Symbol('java'),
    Kotlin: Symbol('kotlin'),
    Swift: Symbol('swift'),
    C: Symbol('c'),
    Cpp: Symbol('cpp'),
    CSharp: Symbol('csharp'),
    Html: Symbol('html'),
    Css: Symbol('css'),
    Json: Symbol('json'),
    Yaml: Symbol('yaml')
  },
  parse: vi.fn()
};

vi.mock('@ast-grep/napi', () => mockSgModule);

// Mock module to intercept createRequire
vi.mock('module', () => ({
  createRequire: vi.fn(() => (moduleName: string) => {
    if (moduleName === '@ast-grep/napi') {
      return mockSgModule;
    }
    throw new Error(`Module not found: ${moduleName}`);
  })
}));

describe('ast-tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset parse mock to return a valid chain
    vi.mocked(mockSgModule.parse).mockReturnValue({
      root: vi.fn().mockReturnValue({
        findAll: vi.fn().mockReturnValue([])
      })
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('astGrepSearchTool', () => {
    it('returns no files found when directory is empty', async () => {
      vi.mocked(path.resolve).mockReturnValue('/test/dir');
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => false, isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await astGrepSearchTool.handler({
        pattern: 'test',
        language: 'javascript',
        path: '/test/dir'
      });

      expect(result.content[0].text).toContain('No javascript files found');
    });

    it('searches for pattern in files', async () => {
      vi.mocked(path.resolve).mockReturnValue('/test/dir');
      vi.mocked(path.join).mockReturnValue('/test/dir/test.js');
      vi.mocked(path.extname).mockReturnValue('.js');
      vi.mocked(fs.statSync).mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockReturnValue({ isFile: () => true, isDirectory: () => false, size: 100 } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.js', isFile: () => true, isDirectory: () => false }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue('function test() {}');

      const mockMatch = {
        text: () => 'function test() {}',
        range: () => ({
          start: { line: 0, index: 0 },
          end: { line: 0, index: 18 }
        })
      };

      const mockRoot = {
        findAll: vi.fn().mockReturnValue([mockMatch])
      };

      const mockParsed = {
        root: vi.fn().mockReturnValue(mockRoot)
      };

      vi.mocked(mockSgModule.parse).mockReturnValueOnce(mockParsed);

      const result = await astGrepSearchTool.handler({
        pattern: 'function $NAME',
        language: 'javascript',
        path: '/test/dir'
      });

      expect(result.content[0].text).toContain('Found 1 match');
      expect(mockSgModule.parse).toHaveBeenCalled();
    });
  });

  describe('astGrepReplaceTool', () => {
    it('previews replacements in dry run mode', async () => {
      vi.mocked(path.resolve).mockReturnValue('/test/dir');
      vi.mocked(path.join).mockReturnValue('/test/dir/test.js');
      vi.mocked(path.extname).mockReturnValue('.js');
      vi.mocked(fs.statSync).mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockReturnValue({ isFile: () => true, isDirectory: () => false, size: 100 } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.js', isFile: () => true, isDirectory: () => false }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue('console.log("test")');

      const mockMatch = {
        text: () => 'console.log("test")',
        range: () => ({
          start: { line: 0, index: 0 },
          end: { line: 0, index: 19 }
        }),
        getMatch: vi.fn()
      };

      const mockRoot = {
        findAll: vi.fn().mockReturnValue([mockMatch])
      };

      const mockParsed = {
        root: vi.fn().mockReturnValue(mockRoot)
      };

      mockSgModule.parse.mockReturnValue(mockParsed);

      const result = await astGrepReplaceTool.handler({
        pattern: 'console.log($MSG)',
        replacement: 'logger.info($MSG)',
        language: 'javascript',
        path: '/test/dir',
        dryRun: true
      });

      expect(result.content[0].text).toContain('DRY RUN');
      expect(result.content[0].text).toContain('To apply changes, run with dryRun: false');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('applies replacements when dryRun is false', async () => {
      vi.mocked(path.resolve).mockReturnValue('/test/dir');
      vi.mocked(path.join).mockReturnValue('/test/dir/test.js');
      vi.mocked(path.extname).mockReturnValue('.js');
      vi.mocked(fs.statSync).mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockReturnValue({ isFile: () => true, isDirectory: () => false, size: 100 } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.js', isFile: () => true, isDirectory: () => false }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue('var x = 1');

      const mockMatch = {
        text: () => 'var x = 1',
        range: () => ({
          start: { line: 0, index: 0 },
          end: { line: 0, index: 9 }
        }),
        getMatch: vi.fn()
      };

      const mockRoot = {
        findAll: vi.fn().mockReturnValue([mockMatch])
      };

      const mockParsed = {
        root: vi.fn().mockReturnValue(mockRoot)
      };

      mockSgModule.parse.mockReturnValue(mockParsed);

      const result = await astGrepReplaceTool.handler({
        pattern: 'var $NAME = $VALUE',
        replacement: 'const $NAME = $VALUE',
        language: 'javascript',
        path: '/test/dir',
        dryRun: false
      });

      expect(result.content[0].text).toContain('CHANGES APPLIED');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('contains expected languages', () => {
      expect(SUPPORTED_LANGUAGES).toContain('javascript');
      expect(SUPPORTED_LANGUAGES).toContain('typescript');
      expect(SUPPORTED_LANGUAGES).toContain('python');
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(10);
    });
  });
});

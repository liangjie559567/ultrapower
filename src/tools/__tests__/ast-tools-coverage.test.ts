import { describe, it, expect, vi, beforeEach } from 'vitest';
import { astGrepSearchTool, astGrepReplaceTool } from '../ast-tools.js';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs');
vi.mock('path');

const mockSgModule = {
  Lang: {
    JavaScript: Symbol('javascript'),
    TypeScript: Symbol('typescript'),
    Tsx: Symbol('tsx'),
    Html: Symbol('html'),
    Css: Symbol('css')
  },
  parse: vi.fn()
};

vi.mock('@ast-grep/napi', () => mockSgModule);
vi.mock('module', () => ({
  createRequire: vi.fn(() => (moduleName: string) => {
    if (moduleName === '@ast-grep/napi') return mockSgModule;
    throw new Error(`Module not found: ${moduleName}`);
  })
}));

describe('ast-tools coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockSgModule.parse).mockReturnValue({
      root: vi.fn().mockReturnValue({
        findAll: vi.fn().mockReturnValue([])
      })
    } as any);
  });

  it('handles parse error for invalid pattern (line 438)', async () => {
    vi.mocked(path.resolve).mockReturnValue('/test');
    vi.mocked(path.join).mockReturnValue('/test/test.js');
    vi.mocked(path.extname).mockReturnValue('.js');
    vi.mocked(fs.statSync).mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
      .mockReturnValue({ isFile: () => true, isDirectory: () => false, size: 100 } as any);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: 'test.js', isFile: () => true, isDirectory: () => false }
    ] as any);
    vi.mocked(fs.readFileSync).mockReturnValue('function test() {}');

    vi.mocked(mockSgModule.parse).mockReturnValue({
      root: vi.fn().mockImplementation(() => { throw new Error('Parse error'); })
    } as any);

    const result = await astGrepSearchTool.handler({
      pattern: 'invalid{{pattern',
      language: 'javascript',
      path: '/test'
    });

    expect(result.content[0].text).toContain('No matches found');
  });

  it('handles meta-variable extraction with getMatch (line 592)', async () => {
    vi.mocked(path.resolve).mockReturnValue('/test');
    vi.mocked(path.join).mockReturnValue('/test/test.js');
    vi.mocked(path.extname).mockReturnValue('.js');
    vi.mocked(fs.statSync).mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
      .mockReturnValue({ isFile: () => true, isDirectory: () => false, size: 100 } as any);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: 'test.js', isFile: () => true, isDirectory: () => false }
    ] as any);
    vi.mocked(fs.readFileSync).mockReturnValue('console.log("test")');

    const mockMatch = {
      text: () => 'console.log("test")',
      range: () => ({ start: { line: 0, index: 0 }, end: { line: 0, index: 19 } }),
      getMatch: vi.fn((name: string) => name === 'MSG' ? { text: () => '"test"' } : null)
    };

    vi.mocked(mockSgModule.parse).mockReturnValue({
      root: vi.fn().mockReturnValue({ findAll: vi.fn().mockReturnValue([mockMatch]) })
    } as any);

    const result = await astGrepReplaceTool.handler({
      pattern: 'console.log($MSG)',
      replacement: 'logger.info($MSG)',
      language: 'javascript',
      path: '/test',
      dryRun: true
    });

    expect(result.content[0].text).toContain('logger.info');
  });

  it('handles no matches in replace (line 640)', async () => {
    vi.mocked(path.resolve).mockReturnValue('/test');
    vi.mocked(path.join).mockReturnValue('/test/test.js');
    vi.mocked(path.extname).mockReturnValue('.js');
    vi.mocked(fs.statSync).mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
      .mockReturnValue({ isFile: () => true, isDirectory: () => false, size: 100 } as any);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: 'test.js', isFile: () => true, isDirectory: () => false }
    ] as any);
    vi.mocked(fs.readFileSync).mockReturnValue('const x = 1');

    vi.mocked(mockSgModule.parse).mockReturnValue({
      root: vi.fn().mockReturnValue({ findAll: vi.fn().mockReturnValue([]) })
    } as any);

    const result = await astGrepReplaceTool.handler({
      pattern: 'console.log($X)',
      replacement: 'logger.info($X)',
      language: 'javascript',
      path: '/test'
    });

    expect(result.content[0].text).toContain('No matches found');
  });

  it('handles replace error (line 676)', async () => {
    vi.mocked(path.resolve).mockImplementation(() => { throw new Error('Path error'); });

    const result = await astGrepReplaceTool.handler({
      pattern: 'test',
      replacement: 'replaced',
      language: 'javascript'
    });

    expect(result.content[0].text).toContain('Error in AST replace');
  });

  it('handles large file streaming (line 214-232)', async () => {
    vi.mocked(path.resolve).mockReturnValue('/test');
    vi.mocked(path.join).mockReturnValue('/test/large.js');
    vi.mocked(path.extname).mockReturnValue('.js');
    vi.mocked(fs.statSync).mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
      .mockReturnValue({ isFile: () => true, isDirectory: () => false, size: 11 * 1024 * 1024 } as any);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: 'large.js', isFile: () => true, isDirectory: () => false }
    ] as any);

    const mockStream = {
      on: vi.fn((event: string, handler: any) => {
        if (event === 'data') handler('const x = 1;');
        if (event === 'end') handler();
        return mockStream;
      })
    };
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    vi.mocked(mockSgModule.parse).mockReturnValue({
      root: vi.fn().mockReturnValue({ findAll: vi.fn().mockReturnValue([]) })
    } as any);

    await astGrepSearchTool.handler({
      pattern: 'const',
      language: 'javascript',
      path: '/test'
    });

    expect(fs.createReadStream).toHaveBeenCalled();
  });

  it('handles file path as input (line 288-289)', async () => {
    vi.mocked(path.resolve).mockReturnValue('/test/file.js');
    vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true, isDirectory: () => false, size: 100 } as any);
    vi.mocked(fs.readFileSync).mockReturnValue('const x = 1;');

    vi.mocked(mockSgModule.parse).mockReturnValue({
      root: vi.fn().mockReturnValue({ findAll: vi.fn().mockReturnValue([]) })
    } as any);

    const result = await astGrepSearchTool.handler({
      pattern: 'const',
      language: 'javascript',
      path: '/test/file.js'
    });

    expect(result.content[0].text).toContain('No matches found');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { dependencyAnalyzerTool } from '../dependency-analyzer';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('dependency-analyzer', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'dep-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('extracts ES6 import dependencies', async () => {
    const testFile = join(testDir, 'test.ts');
    writeFileSync(testFile, `
import { foo } from './local';
import bar from '../parent';
import * as baz from 'external-package';
`);

    const result = await dependencyAnalyzerTool.handler({ filePath: testFile });
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data.dependencies).toContain('external-package');
  });

  it('extracts CommonJS require dependencies', async () => {
    const testFile = join(testDir, 'test.js');
    writeFileSync(testFile, `
const fs = require('fs');
const local = require('./local');
`);

    const result = await dependencyAnalyzerTool.handler({ filePath: testFile });
    const data = JSON.parse(result.content[0].text);
    expect(data.dependencies).toContain('fs');
  });

  it('handles file read errors', async () => {
    const result = await dependencyAnalyzerTool.handler({
      filePath: '/nonexistent/file.ts'
    });
    expect(result.isError).toBe(true);
  });

  it('respects depth parameter', async () => {
    const testFile = join(testDir, 'test.ts');
    writeFileSync(testFile, `import { x } from 'pkg';`);

    const result = await dependencyAnalyzerTool.handler({
      filePath: testFile,
      depth: 2
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.depth).toBe(2);
  });
});

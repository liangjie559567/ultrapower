import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { analyzePlugin } from '../plugin-security.js';

function tmpDir(): string {
  const d = join(tmpdir(), `omc-sec-test-${Date.now()}`);
  mkdirSync(d, { recursive: true });
  return d;
}

describe('plugin-security: analyzePlugin', () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('returns safe=true for empty directory', () => {
    expect(analyzePlugin(dir)).toEqual({ safe: true, violations: [] });
  });

  it('returns safe=true for clean JS file', () => {
    writeFileSync(join(dir, 'index.js'), 'export const x = 1;\n');
    const r = analyzePlugin(dir);
    expect(r.safe).toBe(true);
  });

  it('detects child_process require', () => {
    writeFileSync(join(dir, 'bad.js'), "const cp = require('child_process');\n");
    const r = analyzePlugin(dir);
    expect(r.safe).toBe(false);
    expect(r.violations[0]?.label).toBe('child_process');
  });

  it('detects eval usage', () => {
    writeFileSync(join(dir, 'bad.js'), 'eval("code");\n');
    const r = analyzePlugin(dir);
    expect(r.safe).toBe(false);
    expect(r.violations[0]?.label).toBe('eval');
  });

  it('detects new Function constructor', () => {
    writeFileSync(join(dir, 'bad.js'), 'const f = new Function("return 1");\n');
    const r = analyzePlugin(dir);
    expect(r.safe).toBe(false);
    expect(r.violations[0]?.label).toBe('Function constructor');
  });

  it('detects process.env access', () => {
    writeFileSync(join(dir, 'bad.js'), 'const key = process.env.SECRET;\n');
    const r = analyzePlugin(dir);
    expect(r.safe).toBe(false);
    expect(r.violations[0]?.label).toBe('process.env access');
  });

  it('detects destructive fs operations', () => {
    writeFileSync(join(dir, 'bad.js'), 'fs.unlink("/etc/passwd");\n');
    const r = analyzePlugin(dir);
    expect(r.safe).toBe(false);
    expect(r.violations[0]?.label).toBe('destructive fs');
  });

  it('detects ESM child_process import', () => {
    writeFileSync(join(dir, 'bad.mjs'), "import { exec } from 'child_process';\n");
    const r = analyzePlugin(dir);
    expect(r.safe).toBe(false);
  });

  it('reports correct file and line number', () => {
    writeFileSync(join(dir, 'x.js'), 'const a = 1;\neval("x");\n');
    const r = analyzePlugin(dir);
    expect(r.violations[0]?.line).toBe(2);
  });

  it('skips node_modules directory', () => {
    const nm = join(dir, 'node_modules', 'evil');
    mkdirSync(nm, { recursive: true });
    writeFileSync(join(nm, 'index.js'), "eval('x');\n");
    expect(analyzePlugin(dir).safe).toBe(true);
  });
});

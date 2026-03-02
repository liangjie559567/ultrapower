import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { importKnowledge } from '../index-manager.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'import-test-'));
  await fs.mkdir(path.join(tmpDir, '.omc', 'axiom', 'evolution'), { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const writeJson = (file: string, data: unknown) =>
  fs.writeFile(file, JSON.stringify(data), 'utf-8');

describe('importKnowledge', () => {
  it('正常导入 JSON 文件', async () => {
    const src = path.join(tmpDir, 'units.json');
    await writeJson(src, [{ id: 'u-001', title: 'Unit One', category: 'arch', confidence: 0.8, created: '2026-01-01' }]);
    const result = await importKnowledge(src, 'proj-a', tmpDir);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.namespace).toBe('proj-a');
  });

  it('namespace 隔离（不同 namespace 条目不混合）', async () => {
    const src = path.join(tmpDir, 'units.json');
    await writeJson(src, [{ id: 'u-001', title: 'Unit One' }]);
    await importKnowledge(src, 'proj-a', tmpDir);
    const result = await importKnowledge(src, 'proj-b', tmpDir);
    expect(result.imported).toBe(1);
  });

  it('重复 id 跳过', async () => {
    const src = path.join(tmpDir, 'units.json');
    await writeJson(src, [{ id: 'u-001', title: 'Unit One' }]);
    await importKnowledge(src, 'proj-a', tmpDir);
    const result = await importKnowledge(src, 'proj-a', tmpDir);
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
  });

  it('文件不存在时抛出错误', async () => {
    await expect(importKnowledge('/nonexistent/file.json', 'ns', tmpDir)).rejects.toThrow();
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  atomicWriteJson,
  atomicWriteSync,
  atomicWriteFileSync,
  atomicWriteJsonSync,
  safeReadJson,
  ensureDirSync,
} from '../atomic-write';

const TEST_DIR = path.join(process.cwd(), '.test-atomic-write');

beforeEach(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe('atomicWriteJson', () => {
  it('基本原子写入成功', async () => {
    const filePath = path.join(TEST_DIR, 'test.json');
    const data = { key: 'value', num: 42 };

    await atomicWriteJson(filePath, data);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(JSON.parse(content)).toEqual(data);
  });

  it('目录不存在自动创建', async () => {
    const filePath = path.join(TEST_DIR, 'nested', 'deep', 'test.json');
    const data = { nested: true };

    await atomicWriteJson(filePath, data);

    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content).toEqual(data);
  });

  it('覆盖现有文件', async () => {
    const filePath = path.join(TEST_DIR, 'overwrite.json');

    await atomicWriteJson(filePath, { old: 'data' });
    await atomicWriteJson(filePath, { new: 'data' });

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content).toEqual({ new: 'data' });
  });

  it('无效路径错误处理', async () => {
    const invalidPath = '\0invalid';

    await expect(atomicWriteJson(invalidPath, { data: 'test' })).rejects.toThrow();
  });

  it('临时文件清理验证', async () => {
    const filePath = path.join(TEST_DIR, 'cleanup.json');

    await atomicWriteJson(filePath, { data: 'test' });

    const files = fs.readdirSync(TEST_DIR);
    const tempFiles = files.filter(f => f.includes('.tmp.'));
    expect(tempFiles.length).toBe(0);
  });

  it('顺序多次写入验证原子性', async () => {
    const filePath = path.join(TEST_DIR, 'sequential.json');

    for (let i = 0; i < 5; i++) {
      await atomicWriteJson(filePath, { iteration: i });
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.iteration).toBe(i);
    }

    const tempFiles = fs.readdirSync(TEST_DIR).filter(f => f.includes('.tmp.'));
    expect(tempFiles.length).toBe(0);
  });

  it('权限错误处理', async () => {
    if (process.platform === 'win32') return;

    const readOnlyDir = path.join(TEST_DIR, 'readonly');
    fs.mkdirSync(readOnlyDir);
    fs.chmodSync(readOnlyDir, 0o444);

    const filePath = path.join(readOnlyDir, 'test.json');

    await expect(atomicWriteJson(filePath, { data: 'test' })).rejects.toThrow();

    fs.chmodSync(readOnlyDir, 0o755);
  });
});

describe('atomicWriteSync', () => {
  it('同步写入成功', () => {
    const filePath = path.join(TEST_DIR, 'sync.txt');
    const content = 'test content';

    atomicWriteSync(filePath, content);

    expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
  });

  it('同步写入自动创建目录', () => {
    const filePath = path.join(TEST_DIR, 'a', 'b', 'c', 'sync.txt');

    atomicWriteSync(filePath, 'nested');

    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('同步写入覆盖现有文件', () => {
    const filePath = path.join(TEST_DIR, 'overwrite.txt');

    atomicWriteSync(filePath, 'first');
    atomicWriteSync(filePath, 'second');

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('second');
  });
});

describe('atomicWriteFileSync', () => {
  it('同步文件写入', () => {
    const filePath = path.join(TEST_DIR, 'file.txt');

    atomicWriteFileSync(filePath, 'content');

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('content');
  });

  it('写入大文件', () => {
    const filePath = path.join(TEST_DIR, 'large.txt');
    const largeContent = 'x'.repeat(1024 * 1024);

    atomicWriteFileSync(filePath, largeContent);

    expect(fs.readFileSync(filePath, 'utf-8')).toBe(largeContent);
  });

  it('写入空内容', () => {
    const filePath = path.join(TEST_DIR, 'empty.txt');

    atomicWriteFileSync(filePath, '');

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('');
  });
});

describe('atomicWriteJsonSync', () => {
  it('同步JSON写入', () => {
    const filePath = path.join(TEST_DIR, 'sync.json');
    const data = { sync: true };

    atomicWriteJsonSync(filePath, data);

    expect(JSON.parse(fs.readFileSync(filePath, 'utf-8'))).toEqual(data);
  });

  it('写入复杂JSON对象', () => {
    const filePath = path.join(TEST_DIR, 'complex.json');
    const data = {
      nested: { deep: { value: 123 } },
      array: [1, 2, 3],
      null: null,
      bool: true,
    };

    atomicWriteJsonSync(filePath, data);

    expect(JSON.parse(fs.readFileSync(filePath, 'utf-8'))).toEqual(data);
  });

  it('写入数组', () => {
    const filePath = path.join(TEST_DIR, 'array.json');
    const data = [{ id: 1 }, { id: 2 }];

    atomicWriteJsonSync(filePath, data);

    expect(JSON.parse(fs.readFileSync(filePath, 'utf-8'))).toEqual(data);
  });
});

describe('safeReadJson', () => {
  it('读取存在的JSON文件', async () => {
    const filePath = path.join(TEST_DIR, 'read.json');
    const data = { read: 'success' };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = await safeReadJson(filePath);

    expect(result).toEqual(data);
  });

  it('文件不存在返回null', async () => {
    const filePath = path.join(TEST_DIR, 'nonexistent.json');

    const result = await safeReadJson(filePath);

    expect(result).toBeNull();
  });

  it('JSON解析错误抛出异常', async () => {
    const filePath = path.join(TEST_DIR, 'invalid.json');
    fs.writeFileSync(filePath, 'invalid json{');

    await expect(safeReadJson(filePath)).rejects.toThrow();
  });

  it('读取空JSON对象', async () => {
    const filePath = path.join(TEST_DIR, 'empty.json');
    fs.writeFileSync(filePath, '{}');

    const result = await safeReadJson(filePath);

    expect(result).toEqual({});
  });

  it('读取空数组', async () => {
    const filePath = path.join(TEST_DIR, 'empty-array.json');
    fs.writeFileSync(filePath, '[]');

    const result = await safeReadJson(filePath);

    expect(result).toEqual([]);
  });
});

describe('ensureDirSync', () => {
  it('创建不存在的目录', () => {
    const dir = path.join(TEST_DIR, 'new', 'dir');

    ensureDirSync(dir);

    expect(fs.existsSync(dir)).toBe(true);
  });

  it('目录已存在不报错', () => {
    const dir = path.join(TEST_DIR, 'existing');
    fs.mkdirSync(dir);

    expect(() => ensureDirSync(dir)).not.toThrow();
  });
});

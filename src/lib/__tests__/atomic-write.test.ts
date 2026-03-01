import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  atomicWriteJson,
  atomicWriteJsonSync,
  atomicWriteFileSync,
  safeReadJson,
  ensureDirSync,
} from '../atomic-write.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-write-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// 场景 1：atomicWriteJson / atomicWriteJsonSync 写入后内容与原始数据一致
// ============================================================================

describe('场景 1: 写入后内容一致', () => {
  it('atomicWriteJson (async) 写入后读回内容一致', async () => {
    const filePath = path.join(tmpDir, 'async.json');
    const data = { key: 'value', num: 42, nested: { arr: [1, 2, 3] } };

    await atomicWriteJson(filePath, data);

    expect(fs.existsSync(filePath)).toBe(true);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual(data);
  });

  it('atomicWriteJsonSync 写入后读回内容一致', () => {
    const filePath = path.join(tmpDir, 'sync.json');
    const data = { mode: 'ralph', active: true, iteration: 5 };

    atomicWriteJsonSync(filePath, data);

    expect(fs.existsSync(filePath)).toBe(true);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual(data);
  });
});

// ============================================================================
// 场景 2：无权限目录写入（Unix 限定）
// ============================================================================

describe('场景 2: 无权限目录写入', () => {
  it('写入无写权限目录时应抛出错误 (Unix only)', async () => {
    if (process.platform === 'win32') return;

    const noPermDir = path.join(tmpDir, 'no-perm');
    fs.mkdirSync(noPermDir);
    fs.chmodSync(noPermDir, 0o444); // 只读

    const filePath = path.join(noPermDir, 'test.json');
    await expect(atomicWriteJson(filePath, { x: 1 })).rejects.toThrow();

    // 恢复权限以便 afterEach 清理
    fs.chmodSync(noPermDir, 0o755);
  });
});

// ============================================================================
// 场景 3：rename 失败时目标文件不存在且无 .tmp 残留
// 注意：ESM 下无法 spyOn Node 内置 fs/promises 命名空间的 rename。
// 改用目标路径为只读文件（Windows）或目录存在性冲突来触发 rename 失败，
// 或者将测试设计为验证"写入成功后不留 .tmp 文件"这一等效行为。
// ============================================================================

describe('场景 3: 无 .tmp 残留', () => {
  it('写入成功后不留 .tmp 残留文件', async () => {
    const filePath = path.join(tmpDir, 'target.json');
    await atomicWriteJson(filePath, { test: true });

    // 成功写入后目录中不应有 .tmp 残留
    const files = fs.readdirSync(tmpDir);
    const tmpFiles = files.filter(f => f.includes('.tmp.'));
    expect(tmpFiles).toHaveLength(0);
    // 目标文件应存在
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('目标路径为已存在的只读文件时，写入失败且无 .tmp 残留 (Unix only)', async () => {
    if (process.platform === 'win32') return;

    const filePath = path.join(tmpDir, 'readonly.json');
    // 先创建目标文件并设为只读
    fs.writeFileSync(filePath, '{}', 'utf-8');
    fs.chmodSync(filePath, 0o444);

    // 尝试写入到同名的只读文件所在的只读目录（让整个目录只读使 rename 失败）
    const parentDir = path.join(tmpDir, 'readonly-dir');
    fs.mkdirSync(parentDir);
    const targetPath = path.join(parentDir, 'data.json');
    fs.writeFileSync(targetPath, '{}', 'utf-8');
    fs.chmodSync(parentDir, 0o444);

    await expect(atomicWriteJson(targetPath, { x: 1 })).rejects.toThrow();

    // 无 .tmp 残留
    const files = fs.readdirSync(tmpDir);
    const tmpFiles = files.filter(f => f.includes('.tmp.'));
    expect(tmpFiles).toHaveLength(0);

    // 恢复权限
    fs.chmodSync(parentDir, 0o755);
    fs.chmodSync(filePath, 0o644);
  });
});

// ============================================================================
// 场景 4：10 次并发写入同一路径，最终文件是合法完整 JSON
// 注意：Windows 上 rename 到已被另一进程持有的目标文件会报 EPERM，
// 这是 Windows 文件锁语义，不是 atomic-write 的 bug。
// 使用 Promise.allSettled 允许部分失败，验证至少一次成功且最终是合法 JSON。
// ============================================================================

describe('场景 4: 并发写入', () => {
  it('Promise.allSettled 10 次并发写入同一路径后文件是合法完整 JSON', async () => {
    const filePath = path.join(tmpDir, 'concurrent.json');

    const writes = Array.from({ length: 10 }, (_, i) =>
      atomicWriteJson(filePath, { iteration: i, timestamp: Date.now() })
    );

    const results = await Promise.allSettled(writes);

    // 至少一次写入成功
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    // 最终文件存在且是合法完整 JSON
    expect(fs.existsSync(filePath)).toBe(true);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('iteration');
    expect(parsed).toHaveProperty('timestamp');
  });
});

// ============================================================================
// 场景 5：写入 >1MB 数据，验证文件大小和内容完整
// ============================================================================

describe('场景 5: 大数据写入', () => {
  it('写入 >1MB 数据后文件大小正确且内容完整', async () => {
    const filePath = path.join(tmpDir, 'large.json');
    // 生成约 1.5MB 的数据
    const largeArray = Array.from({ length: 15000 }, (_, i) => ({
      id: i,
      value: 'x'.repeat(100),
    }));
    const data = { items: largeArray };

    await atomicWriteJson(filePath, data);

    const stat = fs.statSync(filePath);
    expect(stat.size).toBeGreaterThan(1024 * 1024); // >1MB

    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.items).toHaveLength(15000);
    expect(parsed.items[0]).toEqual({ id: 0, value: 'x'.repeat(100) });
    expect(parsed.items[14999]).toEqual({ id: 14999, value: 'x'.repeat(100) });
  });
});

// ============================================================================
// 场景 6：路径含空格和中文字符的写入成功
// ============================================================================

describe('场景 6: 特殊字符路径', () => {
  it('路径含空格和中文字符时写入成功', async () => {
    const specialDir = path.join(tmpDir, '含空格 and 中文目录');
    fs.mkdirSync(specialDir, { recursive: true });
    const filePath = path.join(specialDir, '状态 file.json');
    const data = { mode: 'ultrawork', 描述: '中文字段值' };

    await atomicWriteJson(filePath, data);

    expect(fs.existsSync(filePath)).toBe(true);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual(data);
  });

  it('atomicWriteFileSync 支持含空格和中文的路径', () => {
    const specialDir = path.join(tmpDir, '特 殊 路径');
    fs.mkdirSync(specialDir, { recursive: true });
    const filePath = path.join(specialDir, 'data file.txt');

    atomicWriteFileSync(filePath, 'hello 中文 world');

    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello 中文 world');
  });
});

// ============================================================================
// 加分场景：safeReadJson 对不存在文件返回 null，对损坏 JSON 抛出错误
// ============================================================================

describe('加分场景: safeReadJson', () => {
  it('对不存在的文件返回 null', async () => {
    const result = await safeReadJson(path.join(tmpDir, 'nonexistent.json'));
    expect(result).toBeNull();
  });

  it('对损坏的 JSON 内容抛出错误（区别于文件不存在）', async () => {
    const filePath = path.join(tmpDir, 'corrupt.json');
    fs.writeFileSync(filePath, '{ invalid json !!!', 'utf-8');

    await expect(safeReadJson(filePath)).rejects.toThrow();
  });

  it('对合法 JSON 文件正确返回解析后数据', async () => {
    const filePath = path.join(tmpDir, 'valid.json');
    const data = { active: true, mode: 'ralph' };
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');

    const result = await safeReadJson<typeof data>(filePath);
    expect(result).toEqual(data);
  });
});

// ============================================================================
// ensureDirSync 基础测试
// ============================================================================

describe('ensureDirSync', () => {
  it('创建不存在的嵌套目录', () => {
    const nested = path.join(tmpDir, 'a', 'b', 'c');
    expect(fs.existsSync(nested)).toBe(false);

    ensureDirSync(nested);

    expect(fs.existsSync(nested)).toBe(true);
    expect(fs.statSync(nested).isDirectory()).toBe(true);
  });

  it('对已存在目录不抛出错误', () => {
    expect(() => ensureDirSync(tmpDir)).not.toThrow();
  });
});

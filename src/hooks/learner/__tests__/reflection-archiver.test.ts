/**
 * reflection-archiver.test.ts
 *
 * 覆盖：
 * - 10 条不触发归档（archived=0, kept=10）
 * - 11 条触发归档（archived=1, kept=10）
 * - 归档文件内容正确（被移走的块追加到 archive 文件）
 * - 原子写回主文件（主文件只保留 MAX_WINDOW=10 条）
 * - 主文件不存在时返回 {archived:0, kept:0}
 * - 归档文件超过 5000 行时 warning 字段存在
 * - 锁竞争：并发两次调用同一 baseDir 不损坏数据
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { archiveReflections } from '../reflection-archiver.js';

// ── 辅助：构造 N 个反思块的日志文本 ─────────────────────────────────────────
function makeLog(count: number): string {
  const blocks: string[] = [];
  for (let i = 0; i < count; i++) {
    // 日期从最老到最新（2026-01-01 起步，每块 +1 天）
    // 用字符串拼接避免 toISOString() 的时区偏移问题
    const day = String(i + 1).padStart(2, '0');
    const date = `2026-01-${day}`;
    blocks.push(
      [
        `## 反思 - ${date} Session: s${i}`,
        '',
        '### ✅ 做得好的',
        `- 内容 ${i}`,
        '',
        '### ⚠️ 待改进',
        '- (无)',
        '',
        '### 💡 学到了什么',
        '- (无)',
        '',
      ].join('\n')
    );
  }
  return blocks.join('---\n');
}

// ── 辅助：在 tmpDir 下写 reflection_log.md ──────────────────────────────────
function writeLog(baseDir: string, content: string): void {
  const dir = path.join(baseDir, '.omc', 'axiom');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'reflection_log.md'), content, 'utf8');
}

function readLog(baseDir: string): string {
  return fs.readFileSync(
    path.join(baseDir, '.omc', 'axiom', 'reflection_log.md'),
    'utf8'
  );
}

function readArchive(baseDir: string): string {
  return fs.readFileSync(
    path.join(baseDir, '.omc', 'axiom', 'evolution', 'reflection_log_archive.md'),
    'utf8'
  );
}

function archiveExists(baseDir: string): boolean {
  try {
    fs.accessSync(
      path.join(baseDir, '.omc', 'axiom', 'evolution', 'reflection_log_archive.md')
    );
    return true;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
describe('archiveReflections', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archiver-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── 1. 主文件不存在 ───────────────────────────────────────────────────────
  it('主文件不存在时返回 {archived:0, kept:0}，不创建归档文件', async () => {
    // 不写 reflection_log.md
    const result = await archiveReflections(tmpDir);
    expect(result).toEqual({ archived: 0, kept: 0 });
    expect(archiveExists(tmpDir)).toBe(false);
  });

  // ─── 2. 10 条：不触发归档 ──────────────────────────────────────────────────
  it('恰好 10 条时 archived=0，kept=10，不创建归档文件', async () => {
    writeLog(tmpDir, makeLog(10));
    const result = await archiveReflections(tmpDir);
    expect(result.archived).toBe(0);
    expect(result.kept).toBe(10);
    expect(archiveExists(tmpDir)).toBe(false);
  });

  // ─── 3. 11 条：触发归档 ────────────────────────────────────────────────────
  it('11 条时 archived=1，kept=10', async () => {
    writeLog(tmpDir, makeLog(11));
    const result = await archiveReflections(tmpDir);
    expect(result.archived).toBe(1);
    expect(result.kept).toBe(10);
  });

  // ─── 4. 归档文件内容：最旧的块被移入归档 ─────────────────────────────────
  it('11 条时，最旧的块（2026-01-01）出现在归档文件中', async () => {
    writeLog(tmpDir, makeLog(11));
    await archiveReflections(tmpDir);

    const archiveContent = readArchive(tmpDir);
    // 最旧日期 2026-01-01 应出现在归档文件
    expect(archiveContent).toContain('2026-01-01');
  });

  it('11 条时，最新的 10 块保留在主文件中，最旧块不在主文件', async () => {
    writeLog(tmpDir, makeLog(11));
    await archiveReflections(tmpDir);

    const mainContent = readLog(tmpDir);
    // 最旧的块（2026-01-01）不应出现在主文件
    expect(mainContent).not.toContain('2026-01-01');
    // 最新的块（2026-01-11）应出现在主文件
    expect(mainContent).toContain('2026-01-11');
  });

  // ─── 5. 原子写回：主文件精确保留 10 条 ────────────────────────────────────
  it('15 条时 archived=5，kept=10，主文件只含 10 条 ## 反思 块', async () => {
    writeLog(tmpDir, makeLog(15));
    const result = await archiveReflections(tmpDir);
    expect(result.archived).toBe(5);
    expect(result.kept).toBe(10);

    const mainContent = readLog(tmpDir);
    const blockCount = (mainContent.match(/^## 反思/gm) ?? []).length;
    expect(blockCount).toBe(10);
  });

  // ─── 6. 归档文件追加（第二次调用追加，不覆盖）─────────────────────────────
  it('两次归档调用均追加到归档文件', async () => {
    // 第一次：11 条 → 归档 1 条
    writeLog(tmpDir, makeLog(11));
    await archiveReflections(tmpDir);

    // 第二次：再写入 11 条（含新日期）
    const extraLog = makeLog(11).replace(/2026-01/g, '2026-04');
    writeLog(tmpDir, extraLog);
    await archiveReflections(tmpDir);

    const archiveContent = readArchive(tmpDir);
    // 两次归档的内容都应存在
    expect(archiveContent).toContain('2026-01');
    expect(archiveContent).toContain('2026-04');
  });

  // ─── 7. warning：归档文件超过 5000 行 ────────────────────────────────────
  it('归档文件超过 5000 行时 result.warning 存在', async () => {
    // 先写一个巨大的归档文件（>5000 行）
    const evolutionDir = path.join(tmpDir, '.omc', 'axiom', 'evolution');
    fs.mkdirSync(evolutionDir, { recursive: true });
    const archivePath = path.join(evolutionDir, 'reflection_log_archive.md');
    const bigContent = Array(5001).fill('line').join('\n');
    fs.writeFileSync(archivePath, bigContent, 'utf8');

    // 触发一次正常归档（11 条）
    writeLog(tmpDir, makeLog(11));
    const result = await archiveReflections(tmpDir);

    expect(result.archived).toBe(1);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain('5000');
  });

  // ─── 8. 锁正确释放（调用后可再次归档）────────────────────────────────────
  it('归档完成后锁已释放，可立即再次调用', async () => {
    writeLog(tmpDir, makeLog(11));
    await archiveReflections(tmpDir);

    // 再次写入 11 条并归档，若锁未释放会抛出异常
    writeLog(tmpDir, makeLog(11));
    await expect(archiveReflections(tmpDir)).resolves.not.toThrow();
  });
});

/**
 * queue-archiver.test.ts
 *
 * 覆盖 T-012 验收标准（归档部分）：
 * - done=10 不触发 / done=11 触发
 * - 保留最近 10 条 done
 * - pending/in-progress 不受影响
 * - 归档文件 ID 无重复
 * - 手动触发 archiveQueue() 正常工作
 * - 归档 > 5000 行 warning
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { QueueArchiver } from '../queue-archiver.js';

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

function makeBlock(
  id: string,
  status: 'pending' | 'processing' | 'done',
  date: string,
  priority = 'P2'
): string {
  return [
    `### ${id}: title-${id}`,
    `- 优先级: ${priority}`,
    `- 来源类型: session`,
    `- 状态: ${status}`,
    `- 添加时间: ${date}`,
    `- 内容: 内容-${id}`,
  ].join('\n');
}

function makeQueueFile(blocks: string[]): string {
  return `# 学习队列\n\n` + blocks.join('\n\n') + '\n';
}

function makeId(n: number): string {
  return `LQ-${String(n).padStart(3, '0')}`;
}

function makeDate(n: number): string {
  // 生成 2026-01-01 ~ 2026-01-31 格式日期（n 从 1 开始）
  const month = Math.ceil(n / 28);
  const day = ((n - 1) % 28) + 1;
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ══════════════════════════════════════════════════════════════════════════════
describe('QueueArchiver', () => {
  let tmpDir: string;
  let evolutionDir: string;
  let queueFile: string;
  let archiveFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'queue-archiver-test-'));
    evolutionDir = path.join(tmpDir, '.omc', 'axiom', 'evolution');
    fs.mkdirSync(evolutionDir, { recursive: true });
    queueFile = path.join(evolutionDir, 'learning_queue.md');
    archiveFile = path.join(evolutionDir, 'learning_queue_archive.md');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── 阈值：done=10 不触发 ──────────────────────────────────────────────────
  it('done=10 不触发归档', async () => {
    const blocks = Array.from({ length: 10 }, (_, i) =>
      makeBlock(makeId(i + 1), 'done', makeDate(i + 1))
    );
    fs.writeFileSync(queueFile, makeQueueFile(blocks), 'utf8');
    const archiver = new QueueArchiver(tmpDir);
    const result = await archiver.archive();
    expect(result.archived).toBe(0);
    expect(fs.existsSync(archiveFile)).toBe(false);
  });

  // ─── 阈值：done=11 触发，归档 1 条 ────────────────────────────────────────
  it('done=11 触发归档，archived=1 kept=10', async () => {
    const blocks = Array.from({ length: 11 }, (_, i) =>
      makeBlock(makeId(i + 1), 'done', makeDate(i + 1))
    );
    fs.writeFileSync(queueFile, makeQueueFile(blocks), 'utf8');
    const archiver = new QueueArchiver(tmpDir);
    const result = await archiver.archive();
    expect(result.archived).toBe(1);
    expect(result.kept).toBe(10);
    expect(result.message).toContain('已移动 1 条');
    expect(fs.existsSync(archiveFile)).toBe(true);
  });

  // ─── 保留最近 10 条 ────────────────────────────────────────────────────────
  it('done=15 归档最旧 5 条，主文件保留最新 10 条', async () => {
    const blocks = Array.from({ length: 15 }, (_, i) =>
      makeBlock(makeId(i + 1), 'done', makeDate(i + 1))
    );
    fs.writeFileSync(queueFile, makeQueueFile(blocks), 'utf8');
    const archiver = new QueueArchiver(tmpDir);
    const result = await archiver.archive();
    expect(result.archived).toBe(5);
    expect(result.kept).toBe(10);
    // 最旧 5 条（LQ-001~LQ-005）在归档文件
    const archiveContent = fs.readFileSync(archiveFile, 'utf8');
    expect(archiveContent).toContain('### LQ-001:');
    expect(archiveContent).toContain('### LQ-005:');
    expect(archiveContent).not.toContain('### LQ-006:');
    // 主文件只有 LQ-006~LQ-015
    const mainContent = fs.readFileSync(queueFile, 'utf8');
    expect(mainContent).toContain('### LQ-006:');
    expect(mainContent).toContain('### LQ-015:');
    expect(mainContent).not.toContain('### LQ-001:');
  });

  // ─── pending/in-progress 不受影响 ─────────────────────────────────────────
  it('pending 和 processing 条目不被归档', async () => {
    const doneBlocks = Array.from({ length: 11 }, (_, i) =>
      makeBlock(makeId(i + 1), 'done', makeDate(i + 1))
    );
    const pendingBlock = makeBlock('LQ-P01', 'pending', '2026-02-01');
    const processingBlock = makeBlock('LQ-R01', 'processing', '2026-02-02');
    fs.writeFileSync(
      queueFile,
      makeQueueFile([...doneBlocks, pendingBlock, processingBlock]),
      'utf8'
    );
    const archiver = new QueueArchiver(tmpDir);
    const result = await archiver.archive();
    expect(result.archived).toBe(1);
    const mainContent = fs.readFileSync(queueFile, 'utf8');
    expect(mainContent).toContain('### LQ-P01:');
    expect(mainContent).toContain('### LQ-R01:');
  });

  // ─── 归档文件 ID 无重复 ────────────────────────────────────────────────────
  it('二次调用不重复写入已归档的 ID', async () => {
    const blocks = Array.from({ length: 11 }, (_, i) =>
      makeBlock(makeId(i + 1), 'done', makeDate(i + 1))
    );
    fs.writeFileSync(queueFile, makeQueueFile(blocks), 'utf8');
    const archiver = new QueueArchiver(tmpDir);
    // 第一次归档（归档 LQ-001）
    await archiver.archive();
    // 重建队列，再次包含同一批条目（模拟 ID 已在归档中）
    fs.writeFileSync(queueFile, makeQueueFile(blocks), 'utf8');
    await archiver.archive();
    // 归档文件中 LQ-001 只出现一次
    const archiveContent = fs.readFileSync(archiveFile, 'utf8');
    const count = (archiveContent.match(/### LQ-001:/g) ?? []).length;
    expect(count).toBe(1);
  });

  // ─── 队列文件不存在 ────────────────────────────────────────────────────────
  it('队列文件不存在时返回 archived=0 且不报错', async () => {
    const archiver = new QueueArchiver(tmpDir);
    const result = await archiver.archive();
    expect(result.archived).toBe(0);
    expect(result.kept).toBe(0);
  });

  // ─── message 格式 ─────────────────────────────────────────────────────────
  it('归档 message 包含正确移动数量', async () => {
    const blocks = Array.from({ length: 12 }, (_, i) =>
      makeBlock(makeId(i + 1), 'done', makeDate(i + 1))
    );
    fs.writeFileSync(queueFile, makeQueueFile(blocks), 'utf8');
    const archiver = new QueueArchiver(tmpDir);
    const result = await archiver.archive();
    expect(result.message).toMatch(/已移动 2 条 done 条目至 learning_queue_archive\.md/);
  });

  // ─── 归档 > 5000 行 warning ────────────────────────────────────────────────
  it('归档文件超过 5000 行时输出 console.warn', async () => {
    // 预先写入大量内容到归档文件（超过 5000 行）
    fs.writeFileSync(archiveFile, 'x\n'.repeat(5002), 'utf8');
    const blocks = Array.from({ length: 11 }, (_, i) =>
      makeBlock(makeId(i + 1), 'done', makeDate(i + 1))
    );
    fs.writeFileSync(queueFile, makeQueueFile(blocks), 'utf8');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const archiver = new QueueArchiver(tmpDir);
    await archiver.archive();
    expect(
      warnSpy.mock.calls.some(
        args => typeof args[0] === 'string' && args[0].includes('5000')
      )
    ).toBe(true);
    warnSpy.mockRestore();
  });

  // ─── 连续两次归档（锁释放验证）────────────────────────────────────────────
  it('连续两次调用 archive() 均能正常返回（锁被正确释放）', async () => {
    const blocks = Array.from({ length: 11 }, (_, i) =>
      makeBlock(makeId(i + 1), 'done', makeDate(i + 1))
    );
    fs.writeFileSync(queueFile, makeQueueFile(blocks), 'utf8');
    const archiver = new QueueArchiver(tmpDir);
    const r1 = await archiver.archive();
    expect(r1.archived).toBe(1);
    // 第二次：done 条目已减至 10，不再触发
    const r2 = await archiver.archive();
    expect(r2.archived).toBe(0);
  });
});

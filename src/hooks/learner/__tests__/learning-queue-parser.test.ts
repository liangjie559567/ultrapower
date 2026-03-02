/**
 * learning-queue-parser.test.ts
 *
 * 覆盖 T-012 验收标准（解析器部分）：
 * - 多行块格式解析
 * - 旧表格格式兼容
 * - 字段映射正确
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LearningQueue } from '../learning-queue.js';

// ── 测试数据 ─────────────────────────────────────────────────────────────────

const BLOCK_QUEUE = `# 学习队列

### LQ-001: task-completion
- 优先级: P1
- 来源类型: task_completion
- 状态: pending
- 添加时间: 2026-01-10
- 内容: 完成了某个任务

### LQ-002: error-fix
- 优先级: P2
- 来源类型: error_fix
- 状态: done
- 添加时间: 2026-01-09
- 内容: 修复了某个错误

### LQ-003: session-insight
- 优先级: P0
- 来源类型: session
- 状态: processing
- 添加时间: 2026-01-11
- 内容: 会话洞察
`;

const TABLE_QUEUE = `# 学习队列（旧格式）

| ID | SourceType | SourceId | Priority | Created | Status | Description |
|---|---|---|---|---|---|---|
| Q-001 | task | task-1 | P1 | 2026-01-10 | pending | desc1 |
| Q-002 | error | error-1 | P2 | 2026-01-09 | done | desc2 |
`;

// ══════════════════════════════════════════════════════════════════════════════
describe('LearningQueue — 解析器', () => {
  let tmpDir: string;
  let queueFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lq-parser-test-'));
    const evolutionDir = path.join(tmpDir, '.omc', 'axiom', 'evolution');
    fs.mkdirSync(evolutionDir, { recursive: true });
    queueFile = path.join(evolutionDir, 'learning_queue.md');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── 块格式解析 ────────────────────────────────────────────────────────────
  it('块格式：getStats 返回正确的 total/pending/done 数量', async () => {
    fs.writeFileSync(queueFile, BLOCK_QUEUE, 'utf8');
    const lq = new LearningQueue(tmpDir);
    const stats = await lq.getStats();
    expect(stats.total).toBe(3);
    expect(stats.pending).toBe(1);
    expect(stats.done).toBe(1);
  });

  it('块格式：getNextBatch 只返回 pending 条目', async () => {
    fs.writeFileSync(queueFile, BLOCK_QUEUE, 'utf8');
    const lq = new LearningQueue(tmpDir);
    const batch = await lq.getNextBatch(5);
    expect(batch).toHaveLength(1);
    expect(batch[0]?.id).toBe('LQ-001');
    expect(batch[0]?.status).toBe('pending');
  });

  it('块格式：updateStatus 将 pending 改为 done', async () => {
    fs.writeFileSync(queueFile, BLOCK_QUEUE, 'utf8');
    const lq = new LearningQueue(tmpDir);
    await lq.updateStatus('LQ-001', 'done');
    const stats = await lq.getStats();
    expect(stats.pending).toBe(0);
    expect(stats.done).toBe(2);
  });

  // ─── 字段映射正确 ──────────────────────────────────────────────────────────
  it('块格式字段映射：priority/created/status/description/sourceType 均正确', async () => {
    fs.writeFileSync(queueFile, BLOCK_QUEUE, 'utf8');
    const lq = new LearningQueue(tmpDir);
    const batch = await lq.getNextBatch(1);
    const item = batch[0];
    expect(item?.priority).toBe('P1');
    expect(item?.created).toBe('2026-01-10');
    expect(item?.status).toBe('pending');
    expect(item?.description).toBe('完成了某个任务');
    expect(item?.sourceType).toBe('task_completion');
  });

  it('块格式：priority 无效值回退到 P2', async () => {
    const badPriorityBlock = `# 学习队列\n\n### LQ-X01: bad\n- 优先级: P9\n- 来源类型: test\n- 状态: pending\n- 添加时间: 2026-01-01\n- 内容: x\n`;
    fs.writeFileSync(queueFile, badPriorityBlock, 'utf8');
    const lq = new LearningQueue(tmpDir);
    const batch = await lq.getNextBatch(1);
    expect(batch[0]?.priority).toBe('P2');
  });

  // ─── 旧表格格式兼容 ────────────────────────────────────────────────────────
  it('旧表格格式：getStats 正确解析（降级兼容）', async () => {
    fs.writeFileSync(queueFile, TABLE_QUEUE, 'utf8');
    const lq = new LearningQueue(tmpDir);
    const stats = await lq.getStats();
    expect(stats.total).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.done).toBe(1);
  });

  it('旧表格格式：getNextBatch 返回 pending 条目', async () => {
    fs.writeFileSync(queueFile, TABLE_QUEUE, 'utf8');
    const lq = new LearningQueue(tmpDir);
    const batch = await lq.getNextBatch(5);
    expect(batch).toHaveLength(1);
    expect(batch[0]?.id).toBe('Q-001');
    expect(batch[0]?.priority).toBe('P1');
  });

  // ─── addItem 写入块格式 ────────────────────────────────────────────────────
  it('addItem 在块格式文件中追加新块', async () => {
    fs.writeFileSync(queueFile, BLOCK_QUEUE, 'utf8');
    const lq = new LearningQueue(tmpDir);
    await lq.addItem('session', 'new-item', 'P2', '新条目描述');
    const stats = await lq.getStats();
    expect(stats.total).toBe(4);
    const content = fs.readFileSync(queueFile, 'utf8');
    expect(content).toContain('- 来源类型: session');
    expect(content).toContain('- 内容: 新条目描述');
  });
});

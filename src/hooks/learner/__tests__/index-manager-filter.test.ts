/**
 * index-manager-filter.test.ts
 *
 * 覆盖 T-008 验收标准：
 * - --filter keyword：只返回 Title/Category 含关键词的条目
 * - --category cat：只返回 Category 精确匹配的条目
 * - 无参数（loadIndex）：返回全量
 * - 结果统计正确（entries.length, total）
 * - 超 256 字符关键词抛出 Error
 * - 大小写不敏感验证
 * - 空结果（返回 entries=[]，total 为全量）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { KnowledgeIndexManager } from '../index-manager.js';

// ── 辅助：构造 knowledge_base.md 内容（表格格式，对齐 writeIndex 输出） ───────
function makeKnowledgeBase(
  entries: Array<{ id: string; title: string; category: string; confidence?: number; created?: string }>
): string {
  const rows = entries.map(
    e =>
      `| ${e.id} | ${e.title} | ${e.category} | ${(e.confidence ?? 0.8).toFixed(2)} | ${e.created ?? '2026-01-01'} | active |`
  );
  return [
    '# Knowledge Base Index',
    '',
    '> Last updated: 2026-03-02 | Total: 3 entries',
    '',
    '## Knowledge Index',
    '',
    '| ID | Title | Category | Confidence | Created | Status |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

// ── 示例知识条目 ─────────────────────────────────────────────────────────────
const SAMPLE_ENTRIES = [
  { id: 'k-001', title: 'TypeScript 严格模式最佳实践', category: 'typescript' },
  { id: 'k-002', title: '原子写入防止并发损坏', category: 'architecture' },
  { id: 'k-003', title: 'TypeScript 路径别名配置', category: 'typescript' },
  { id: 'k-004', title: 'Git 提交规范与原子提交', category: 'git-workflow' },
  { id: 'k-005', title: '文件锁实现互斥访问', category: 'architecture' },
];

// ══════════════════════════════════════════════════════════════════════════════
describe('KnowledgeIndexManager — filterByKeyword / filterByCategory', () => {
  let tmpDir: string;
  let manager: KnowledgeIndexManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'index-filter-test-'));
    // 创建索引文件
    const evolutionDir = path.join(tmpDir, '.omc', 'axiom', 'evolution');
    fs.mkdirSync(evolutionDir, { recursive: true });
    fs.writeFileSync(
      path.join(evolutionDir, 'knowledge_base.md'),
      makeKnowledgeBase(SAMPLE_ENTRIES),
      'utf8'
    );
    manager = new KnowledgeIndexManager(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── 1. loadIndex 全量返回 ─────────────────────────────────────────────────
  it('loadIndex 返回全量 5 条', async () => {
    const entries = await manager.loadIndex();
    expect(entries).toHaveLength(5);
  });

  // ─── 2. filterByKeyword：关键词匹配 title ───────────────────────────────────
  it('--filter typescript 返回 title 含 typescript 的条目', async () => {
    const result = await manager.filterByKeyword('typescript');
    // k-001 和 k-003 的 title 含 TypeScript，category 也是 typescript
    expect(result.entries.length).toBeGreaterThanOrEqual(2);
    expect(result.entries.every(
      e => e.title.toLowerCase().includes('typescript') || e.category.toLowerCase().includes('typescript')
    )).toBe(true);
  });

  it('--filter 返回的 total 等于全量条目数', async () => {
    const result = await manager.filterByKeyword('typescript');
    expect(result.total).toBe(5);
  });

  // ─── 3. filterByKeyword：关键词匹配 category ──────────────────────────────
  it('--filter architecture 匹配 category=architecture 的条目', async () => {
    const result = await manager.filterByKeyword('architecture');
    expect(result.entries).toHaveLength(2);
    expect(result.entries.map(e => e.id).sort()).toEqual(['k-002', 'k-005']);
  });

  // ─── 4. filterByKeyword：大小写不敏感 ────────────────────────────────────
  it('--filter TypeScript（大写）与 --filter typescript 结果相同', async () => {
    const lower = await manager.filterByKeyword('typescript');
    const upper = await manager.filterByKeyword('TypeScript');
    expect(lower.entries.map(e => e.id).sort()).toEqual(upper.entries.map(e => e.id).sort());
  });

  it('--filter ARCHITECTURE（全大写）匹配正常', async () => {
    const result = await manager.filterByKeyword('ARCHITECTURE');
    expect(result.entries).toHaveLength(2);
  });

  // ─── 5. filterByKeyword：空结果 ────────────────────────────────────────────
  it('--filter 不存在的关键词返回空数组，total 为全量', async () => {
    const result = await manager.filterByKeyword('python');
    expect(result.entries).toHaveLength(0);
    expect(result.total).toBe(5);
  });

  // ─── 6. filterByKeyword：超 256 字符抛出 Error ────────────────────────────
  it('--filter 超过 256 字符抛出 Error', async () => {
    const longKeyword = 'a'.repeat(257);
    await expect(manager.filterByKeyword(longKeyword)).rejects.toThrow('256');
  });

  it('--filter 恰好 256 字符不抛出', async () => {
    const keyword = 'a'.repeat(256);
    await expect(manager.filterByKeyword(keyword)).resolves.toBeDefined();
  });

  // ─── 7. filterByCategory：精确匹配 ───────────────────────────────────────
  it('--category typescript 只返回 category=typescript 的条目', async () => {
    const result = await manager.filterByCategory('typescript');
    expect(result.entries).toHaveLength(2);
    expect(result.entries.every(e => e.category === 'typescript')).toBe(true);
    expect(result.entries.map(e => e.id).sort()).toEqual(['k-001', 'k-003']);
  });

  it('--category architecture 只返回 category=architecture 的条目', async () => {
    const result = await manager.filterByCategory('architecture');
    expect(result.entries).toHaveLength(2);
    expect(result.entries.map(e => e.id).sort()).toEqual(['k-002', 'k-005']);
  });

  // ─── 8. filterByCategory：大小写不敏感 ──────────────────────────────────
  it('--category TypeScript（混合大小写）与 --category typescript 结果相同', async () => {
    const lower = await manager.filterByCategory('typescript');
    const mixed = await manager.filterByCategory('TypeScript');
    expect(lower.entries.map(e => e.id).sort()).toEqual(mixed.entries.map(e => e.id).sort());
  });

  // ─── 9. filterByCategory：精确匹配不含部分匹配 ───────────────────────────
  it('--category type（只是 typescript 的前缀）不返回 typescript 条目', async () => {
    const result = await manager.filterByCategory('type');
    expect(result.entries).toHaveLength(0);
  });

  // ─── 10. filterByCategory：空结果 ─────────────────────────────────────────
  it('--category 不存在的分类返回空数组，total 为全量', async () => {
    const result = await manager.filterByCategory('nonexistent');
    expect(result.entries).toHaveLength(0);
    expect(result.total).toBe(5);
  });

  // ─── 11. filterByCategory：total 字段 ─────────────────────────────────────
  it('filterByCategory 的 total 等于全量条目数', async () => {
    const result = await manager.filterByCategory('git-workflow');
    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(5);
  });

  // ─── 12. filterByKeyword 匹配 title 与 category 的联合 ──────────────────
  it('--filter 原子 同时匹配 title 含"原子"的条目', async () => {
    const result = await manager.filterByKeyword('原子');
    // k-002 title 含"原子"，k-004 title 含"原子"
    expect(result.entries.map(e => e.id)).toContain('k-002');
    expect(result.entries.map(e => e.id)).toContain('k-004');
  });
});

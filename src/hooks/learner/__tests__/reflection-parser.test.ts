/**
 * reflection-parser.test.ts
 *
 * 覆盖：
 * - 正常块解析（有效内容）
 * - 空条目识别（三核心小节均为占位符 → isEmpty=true）
 * - 混合块（有效 + 空条目）
 * - 块边界：--- 分隔符归属前一块
 * - 日期倒序排列
 * - 文件头部非 "## 反思" 内容被跳过
 * - 无块时返回空数组
 */

import { describe, it, expect } from 'vitest';
import { parseReflectionLog } from '../reflection-parser.js';

// ── 辅助：构造一个标准反思块字符串 ──────────────────────────────────────────
function makeBlock(
  date: string,
  {
    wentWell = ['- (无)'],
    improve = ['- (无)'],
    learnings = ['- (无)'],
  }: {
    wentWell?: string[];
    improve?: string[];
    learnings?: string[];
  } = {}
): string {
  return [
    `## 反思 - ${date} Session: test`,
    '',
    '### ✅ 做得好的',
    ...wentWell,
    '',
    '### ⚠️ 待改进',
    ...improve,
    '',
    '### 💡 学到了什么',
    ...learnings,
    '',
  ].join('\n');
}

// ── 辅助：带 --- 分隔符拼接多块 ─────────────────────────────────────────────
function joinBlocks(...blocks: string[]): string {
  return blocks.join('---\n');
}

// ══════════════════════════════════════════════════════════════════════════════
describe('parseReflectionLog', () => {
  // ─── 1. 无块时返回空数组 ───────────────────────────────────────────────────
  it('空文本返回空数组', () => {
    expect(parseReflectionLog('')).toEqual([]);
  });

  it('只有文件头（无 ## 反思 块）返回空数组', () => {
    const text = '# Reflection Log\n\n这是文件头，没有任何反思块。\n';
    expect(parseReflectionLog(text)).toEqual([]);
  });

  // ─── 2. 正常块解析 ─────────────────────────────────────────────────────────
  it('解析单个有效块，header/date/isEmpty 正确', () => {
    const block = makeBlock('2026-02-27', {
      wentWell: ['- TypeScript 编译零错误'],
      improve: ['- (无)'],
      learnings: ['- 原子写入可避免并发损坏'],
    });
    const result = parseReflectionLog(block);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-02-27');
    expect(result[0].header).toMatch(/^## 反思/);
    expect(result[0].isEmpty).toBe(false);
  });

  it('rawContent 包含块完整文本', () => {
    const block = makeBlock('2026-03-01', {
      wentWell: ['- CI 通过'],
      improve: ['- (无)'],
      learnings: ['- (无)'],
    });
    const result = parseReflectionLog(block);

    expect(result[0].rawContent).toContain('## 反思 - 2026-03-01');
    expect(result[0].rawContent).toContain('CI 通过');
  });

  // ─── 3. 空条目识别 ─────────────────────────────────────────────────────────
  it('三核心小节均为 - (无) → isEmpty=true', () => {
    const block = makeBlock('2026-02-20');
    const result = parseReflectionLog(block);
    expect(result[0].isEmpty).toBe(true);
  });

  it('三核心小节均为纯 - 占位符 → isEmpty=true', () => {
    const block = makeBlock('2026-02-21', {
      wentWell: ['-'],
      improve: ['-'],
      learnings: ['-'],
    });
    const result = parseReflectionLog(block);
    expect(result[0].isEmpty).toBe(true);
  });

  it('三核心小节均为 (无) → isEmpty=true', () => {
    const block = makeBlock('2026-02-22', {
      wentWell: ['(无)'],
      improve: ['(无)'],
      learnings: ['(无)'],
    });
    const result = parseReflectionLog(block);
    expect(result[0].isEmpty).toBe(true);
  });

  it('三核心小节均为空行 → isEmpty=true', () => {
    const block = makeBlock('2026-02-23', {
      wentWell: [''],
      improve: [''],
      learnings: [''],
    });
    const result = parseReflectionLog(block);
    expect(result[0].isEmpty).toBe(true);
  });

  it('三核心小节均为 HTML 注释 → isEmpty=true', () => {
    const block = makeBlock('2026-02-24', {
      wentWell: ['<!-- 占位 -->'],
      improve: ['<!-- 占位 -->'],
      learnings: ['<!-- 占位 -->'],
    });
    const result = parseReflectionLog(block);
    expect(result[0].isEmpty).toBe(true);
  });

  // ─── 4. 有一个小节有内容 → isEmpty=false ───────────────────────────────────
  it('只有 做得好的 有内容 → isEmpty=false', () => {
    const block = makeBlock('2026-02-25', {
      wentWell: ['- 测试全部通过'],
      improve: ['- (无)'],
      learnings: ['- (无)'],
    });
    const result = parseReflectionLog(block);
    expect(result[0].isEmpty).toBe(false);
  });

  it('只有 学到了什么 有内容 → isEmpty=false', () => {
    const block = makeBlock('2026-02-26', {
      wentWell: ['- (无)'],
      improve: ['- (无)'],
      learnings: ['- 文件锁防并发损坏'],
    });
    const result = parseReflectionLog(block);
    expect(result[0].isEmpty).toBe(false);
  });

  // ─── 5. 混合块（有效 + 空条目） ────────────────────────────────────────────
  it('两块混合：一个有内容，一个空 → isEmpty 各自正确', () => {
    const validBlock = makeBlock('2026-03-02', {
      wentWell: ['- 有效内容'],
      improve: ['- (无)'],
      learnings: ['- (无)'],
    });
    const emptyBlock = makeBlock('2026-03-01');
    const text = joinBlocks(validBlock, emptyBlock);

    const result = parseReflectionLog(text);
    expect(result).toHaveLength(2);

    // 结果按日期倒序：2026-03-02 在前
    const newer = result.find(b => b.date === '2026-03-02');
    const older = result.find(b => b.date === '2026-03-01');

    expect(newer?.isEmpty).toBe(false);
    expect(older?.isEmpty).toBe(true);
  });

  // ─── 6. --- 分隔符归属前一块 ───────────────────────────────────────────────
  it('--- 分隔符包含在前一块的 rawContent 中，后一块不含', () => {
    const block1 = makeBlock('2026-03-02', { wentWell: ['- A'] });
    const block2 = makeBlock('2026-03-01', { wentWell: ['- B'] });
    const text = block1 + '---\n' + block2;

    const result = parseReflectionLog(text);
    expect(result).toHaveLength(2);

    // 倒序：2026-03-02 在前
    const r1 = result.find(b => b.date === '2026-03-02')!;
    const r2 = result.find(b => b.date === '2026-03-01')!;

    expect(r1.rawContent).toContain('---');
    expect(r2.rawContent).not.toContain('---');
  });

  // ─── 7. 日期倒序排列 ───────────────────────────────────────────────────────
  it('多块按日期倒序排列', () => {
    const blocks = [
      makeBlock('2026-01-10'),
      makeBlock('2026-03-05'),
      makeBlock('2026-02-14'),
    ];
    const text = blocks.join('\n');
    const result = parseReflectionLog(text);

    expect(result.map(b => b.date)).toEqual(['2026-03-05', '2026-02-14', '2026-01-10']);
  });

  // ─── 8. 文件头部内容被跳过 ─────────────────────────────────────────────────
  it('文件头部非 ## 反思 内容被跳过，不影响块数量', () => {
    const header = '# Reflection Log\n\n> 自动生成，请勿手动编辑\n\n';
    const block = makeBlock('2026-03-02', { wentWell: ['- OK'] });
    const text = header + block;

    const result = parseReflectionLog(text);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-03-02');
  });

  // ─── 9. 无日期标题 → date 为空字符串 ──────────────────────────────────────
  it('标题无日期时 date 为空字符串', () => {
    const text = '## 反思 无日期标题\n### ✅ 做得好的\n- 内容\n';
    const result = parseReflectionLog(text);
    expect(result[0].date).toBe('');
  });

  // ─── 10. 不带 emoji 的小节标题也能识别 ────────────────────────────────────
  it('不带 emoji 的小节标题（做得好的/待改进/学到了什么）内容识别正常', () => {
    const text = [
      '## 反思 - 2026-03-03 Session: x',
      '### 做得好的',
      '- 有效内容',
      '### 待改进',
      '- (无)',
      '### 学到了什么',
      '- (无)',
      '',
    ].join('\n');
    const result = parseReflectionLog(text);
    expect(result[0].isEmpty).toBe(false);
  });
});

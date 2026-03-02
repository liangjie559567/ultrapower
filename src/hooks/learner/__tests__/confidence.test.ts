import { describe, it, expect } from 'vitest';
import { decayConfidence } from '../confidence.js';
import type { KnowledgeUnit } from '../types.js';

const base: KnowledgeUnit = {
  id: 'k-001',
  title: 'Test',
  content: 'content',
  tags: [],
  confidence: 0.9,
  source_project: 'ultrapower',
  namespace: 'ultrapower',
  created: '2026-01-01',
  last_used: '2026-01-01',
};

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('decayConfidence', () => {
  it('29天内不衰减', () => {
    const unit = { ...base, last_used: daysAgo(29) };
    expect(decayConfidence(unit).confidence).toBe(0.9);
  });

  it('恰好30天触发衰减', () => {
    const unit = { ...base, last_used: daysAgo(30) };
    const result = decayConfidence(unit);
    expect(result.confidence).toBe(0.81);
  });

  it('多次衰减累积', () => {
    const unit = { ...base, last_used: daysAgo(31) };
    const once = decayConfidence(unit);
    const twice = decayConfidence({ ...once, last_used: daysAgo(31) });
    expect(twice.confidence).toBeLessThan(once.confidence);
  });

  it('最低值 0.1 边界', () => {
    const unit = { ...base, confidence: 0.05, last_used: daysAgo(31) };
    expect(decayConfidence(unit).confidence).toBe(0.1);
  });

  it('nowMs 参数注入（时间可控）', () => {
    const fixedNow = new Date('2026-03-02').getTime();
    const unit = { ...base, last_used: '2026-01-01' };
    const result = decayConfidence(unit, 30, 0.9, 0.1, fixedNow);
    expect(result.confidence).toBeLessThan(0.9);
  });
});

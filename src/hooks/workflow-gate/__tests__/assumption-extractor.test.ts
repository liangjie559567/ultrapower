import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { extractAssumptionsFromPlan } from '../assumption-extractor.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-assumptions');

describe('extractAssumptionsFromPlan', () => {
  beforeEach(() => {
    mkdirSync(join(TEST_DIR, '.omc/plans'), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should extract English assumptions', () => {
    const planContent = `# Plan
Assumption: API returns JSON format
Assumption: Database is PostgreSQL
`;
    writeFileSync(join(TEST_DIR, '.omc/plans/plan.md'), planContent);

    const result = extractAssumptionsFromPlan(TEST_DIR);

    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('API returns JSON format');
    expect(result[1].description).toBe('Database is PostgreSQL');
  });

  it('should extract Chinese assumptions', () => {
    const planContent = `# 计划
假设: 用户已登录
假设: 数据库连接正常
`;
    writeFileSync(join(TEST_DIR, '.omc/plans/plan.md'), planContent);

    const result = extractAssumptionsFromPlan(TEST_DIR);

    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('用户已登录');
  });

  it('should return empty array when no plan file', () => {
    const result = extractAssumptionsFromPlan(TEST_DIR);
    expect(result).toEqual([]);
  });

  it('should return empty array when no assumptions', () => {
    writeFileSync(join(TEST_DIR, '.omc/plans/plan.md'), '# Plan\nNo assumptions here');

    const result = extractAssumptionsFromPlan(TEST_DIR);
    expect(result).toEqual([]);
  });

  it('should set verified to false by default', () => {
    writeFileSync(join(TEST_DIR, '.omc/plans/plan.md'), 'Assumption: test');

    const result = extractAssumptionsFromPlan(TEST_DIR);

    expect(result[0].verified).toBe(false);
  });
});

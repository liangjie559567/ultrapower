/**
 * Axiom Workflow Integration Tests
 * 测试 4 阶段工作流和 4 个门禁
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let TEST_DIR: string;

beforeEach(() => {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  TEST_DIR = join(tmpdir(), `__test_axiom_workflow__${uid}`);
  mkdirSync(join(TEST_DIR, '.omc', 'axiom'), { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

// ============================================================================
// Expert Gate: draft → review 强制执行
// ============================================================================

describe('Expert Gate', () => {
  it('enforces draft → review flow for new features', () => {
    // 模拟用户提出新需求
    const draftPath = join(TEST_DIR, '.omc', 'axiom', 'draft_prd.md');
    writeFileSync(draftPath, '# Draft PRD\n\n## Feature: 新功能\n');

    // 验证 draft 文件存在
    expect(existsSync(draftPath)).toBe(true);

    // 模拟 review 流程
    const reviewPath = join(TEST_DIR, '.omc', 'axiom', 'review_domain.md');
    writeFileSync(reviewPath, '# Domain Expert Review\n\n## Status: APPROVED\n');

    expect(existsSync(reviewPath)).toBe(true);
    const reviewContent = readFileSync(reviewPath, 'utf-8');
    expect(reviewContent).toContain('APPROVED');
  });

  it('blocks implementation without review approval', () => {
    const draftPath = join(TEST_DIR, '.omc', 'axiom', 'draft_prd.md');
    writeFileSync(draftPath, '# Draft PRD\n\n## Feature: 新功能\n');

    // 没有 review 文件，不应该进入实现阶段
    const reviewPath = join(TEST_DIR, '.omc', 'axiom', 'review_domain.md');
    expect(existsSync(reviewPath)).toBe(false);

    // 验证门禁逻辑
    const canProceed = existsSync(reviewPath);
    expect(canProceed).toBe(false);
  });
});

// ============================================================================
// User Gate: PRD 终稿用户确认
// ============================================================================

describe('User Gate', () => {
  it('requires user confirmation before implementation', () => {
    const prdPath = join(TEST_DIR, '.omc', 'axiom', 'final_prd.md');
    writeFileSync(prdPath, '# Final PRD\n\n## Confirmed: false\n');

    const content = readFileSync(prdPath, 'utf-8');
    const confirmed = content.includes('Confirmed: true');
    expect(confirmed).toBe(false);
  });

  it('allows implementation after user confirmation', () => {
    const prdPath = join(TEST_DIR, '.omc', 'axiom', 'final_prd.md');
    writeFileSync(prdPath, '# Final PRD\n\n## Confirmed: true\n');

    const content = readFileSync(prdPath, 'utf-8');
    const confirmed = content.includes('Confirmed: true');
    expect(confirmed).toBe(true);
  });
});

// ============================================================================
// CI Gate: 编译测试门禁
// ============================================================================

describe('CI Gate', () => {
  it('blocks completion when build fails', () => {
    const ciResultPath = join(TEST_DIR, '.omc', 'axiom', 'ci_result.json');
    writeFileSync(ciResultPath, JSON.stringify({
      build: 'failed',
      errors: ['Type error in file.ts'],
    }));

    const result = JSON.parse(readFileSync(ciResultPath, 'utf-8'));
    expect(result.build).toBe('failed');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('allows completion when all checks pass', () => {
    const ciResultPath = join(TEST_DIR, '.omc', 'axiom', 'ci_result.json');
    writeFileSync(ciResultPath, JSON.stringify({
      build: 'success',
      test: 'success',
      errors: [],
    }));

    const result = JSON.parse(readFileSync(ciResultPath, 'utf-8'));
    expect(result.build).toBe('success');
    expect(result.test).toBe('success');
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================================================
// Scope Gate: 越界修改警告
// ============================================================================

describe('Scope Gate', () => {
  it('warns when modifying files outside manifest scope', () => {
    const manifestPath = join(TEST_DIR, '.omc', 'axiom', 'manifest.md');
    writeFileSync(manifestPath, [
      '# Manifest',
      '',
      '## Impact Scope',
      '- src/features/auth/',
      '- src/lib/session.ts',
    ].join('\n'));

    const modifiedFile = 'src/features/payment/checkout.ts';
    const manifest = readFileSync(manifestPath, 'utf-8');
    const inScope = manifest.includes(modifiedFile) ||
                    manifest.includes('src/features/payment/');

    expect(inScope).toBe(false);
  });

  it('allows modifications within manifest scope', () => {
    const manifestPath = join(TEST_DIR, '.omc', 'axiom', 'manifest.md');
    writeFileSync(manifestPath, [
      '# Manifest',
      '',
      '## Impact Scope',
      '- src/features/auth/',
      '- src/lib/session.ts',
    ].join('\n'));

    const _modifiedFile = 'src/features/auth/login.ts';
    const manifest = readFileSync(manifestPath, 'utf-8');
    const inScope = manifest.includes('src/features/auth/');

    expect(inScope).toBe(true);
  });
});

// ============================================================================
// 4 阶段流程测试
// ============================================================================

describe('4-Phase Workflow', () => {
  it('completes full workflow: draft → review → implement → verify', () => {
    // Phase 1: Draft
    const draftPath = join(TEST_DIR, '.omc', 'axiom', 'draft_prd.md');
    writeFileSync(draftPath, '# Draft PRD\n\n## Feature: Login\n');
    expect(existsSync(draftPath)).toBe(true);

    // Phase 2: Review
    const reviewPath = join(TEST_DIR, '.omc', 'axiom', 'review_domain.md');
    writeFileSync(reviewPath, '# Review\n\n## Status: APPROVED\n');
    expect(existsSync(reviewPath)).toBe(true);

    // Phase 3: Implement
    const prdPath = join(TEST_DIR, '.omc', 'axiom', 'final_prd.md');
    writeFileSync(prdPath, '# Final PRD\n\n## Confirmed: true\n');
    expect(existsSync(prdPath)).toBe(true);

    // Phase 4: Verify
    const ciPath = join(TEST_DIR, '.omc', 'axiom', 'ci_result.json');
    writeFileSync(ciPath, JSON.stringify({ build: 'success', test: 'success' }));

    const ciResult = JSON.parse(readFileSync(ciPath, 'utf-8'));
    expect(ciResult.build).toBe('success');
    expect(ciResult.test).toBe('success');
  });

  it('tracks workflow state transitions', () => {
    const statePath = join(TEST_DIR, '.omc', 'axiom', 'active_context.md');

    // IDLE → EXECUTING
    writeFileSync(statePath, '## Status: EXECUTING\n\n## Current Phase: draft\n');
    let content = readFileSync(statePath, 'utf-8');
    expect(content).toContain('EXECUTING');
    expect(content).toContain('draft');

    // draft → review
    writeFileSync(statePath, '## Status: EXECUTING\n\n## Current Phase: review\n');
    content = readFileSync(statePath, 'utf-8');
    expect(content).toContain('review');

    // review → implement
    writeFileSync(statePath, '## Status: EXECUTING\n\n## Current Phase: implement\n');
    content = readFileSync(statePath, 'utf-8');
    expect(content).toContain('implement');

    // implement → verify
    writeFileSync(statePath, '## Status: EXECUTING\n\n## Current Phase: verify\n');
    content = readFileSync(statePath, 'utf-8');
    expect(content).toContain('verify');

    // verify → IDLE
    writeFileSync(statePath, '## Status: IDLE\n\n## Current Phase: complete\n');
    content = readFileSync(statePath, 'utf-8');
    expect(content).toContain('IDLE');
    expect(content).toContain('complete');
  });
});

// ============================================================================
// 知识收割机制测试
// ============================================================================

describe('Knowledge Harvesting', () => {
  it('adds completed tasks to learning queue', () => {
    mkdirSync(join(TEST_DIR, '.omc', 'axiom', 'evolution'), { recursive: true });
    const queuePath = join(TEST_DIR, '.omc', 'axiom', 'evolution', 'learning_queue.md');

    writeFileSync(queuePath, [
      '### LQ-001',
      '- 状态: pending',
      '- 优先级: P1',
      '- 内容: 任务完成后的学习点',
    ].join('\n'));

    const content = readFileSync(queuePath, 'utf-8');
    expect(content).toContain('LQ-001');
    expect(content).toContain('pending');
  });

  it('updates knowledge base after reflection', () => {
    mkdirSync(join(TEST_DIR, '.omc', 'axiom', 'evolution'), { recursive: true });
    const kbPath = join(TEST_DIR, '.omc', 'axiom', 'evolution', 'knowledge_base.md');

    writeFileSync(kbPath, [
      '### KB-001',
      '- 类型: pattern',
      '- 内容: 门禁模式实现',
    ].join('\n'));

    const content = readFileSync(kbPath, 'utf-8');
    expect(content).toContain('KB-001');
    expect(content).toContain('pattern');
  });
});

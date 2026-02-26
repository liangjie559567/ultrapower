/**
 * OMC HUD - Axiom State Element Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  readAxiomStateForHud,
  renderAxiom,
} from '../hud/elements/axiom.js';

let TEST_DIR: string;

beforeEach(() => {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  TEST_DIR = join(tmpdir(), `__test_hud_axiom__${uid}`);
  mkdirSync(join(TEST_DIR, '.omc', 'axiom', 'evolution'), { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

// ============================================================================
// readAxiomStateForHud
// ============================================================================

describe('readAxiomStateForHud', () => {
  it('returns null when .omc/axiom/ does not exist', () => {
    const emptyDir = join(tmpdir(), `__test_no_axiom__${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });
    try {
      expect(readAxiomStateForHud(emptyDir)).toBeNull();
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('returns default IDLE state when axiom dir exists but files are empty', () => {
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state).not.toBeNull();
    expect(state!.status).toBe('IDLE');
    expect(state!.currentGoal).toBeNull();
    expect(state!.learningQueueCount).toBe(0);
    expect(state!.knowledgeBaseCount).toBe(0);
    expect(state!.workflowSuccessRate).toBeNull();
  });

  it('parses EXECUTING status from active_context.md', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'active_context.md'),
      '## Status: EXECUTING\n\n## Current Goal\nHUD 重设计\n'
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.status).toBe('EXECUTING');
    expect(state!.currentGoal).toBe('HUD 重设计');
  });

  it('parses BLOCKED status', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'active_context.md'),
      '## Status: BLOCKED\n'
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.status).toBe('BLOCKED');
  });

  it('ignores placeholder current goal', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'active_context.md'),
      '## Status: IDLE\n\n## Current Goal\n[填写当前目标]\n'
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.currentGoal).toBeNull();
  });

  it('counts in-progress and pending tasks', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'active_context.md'),
      [
        '## Status: EXECUTING',
        '',
        '### In Progress',
        '- task-1',
        '- task-2',
        '',
        '### Pending',
        '- task-3',
        '',
      ].join('\n')
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.inProgressCount).toBe(2);
    expect(state!.pendingCount).toBe(1);
  });

  it('does not count (none) placeholder lines', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'active_context.md'),
      [
        '## Status: IDLE',
        '',
        '### In Progress',
        '- (none)',
        '',
        '### Pending',
        '- (none)',
        '',
      ].join('\n')
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.inProgressCount).toBe(0);
    expect(state!.pendingCount).toBe(0);
  });

  it('parses learning queue count and top priority', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'evolution', 'learning_queue.md'),
      [
        '### LQ-001',
        '- 状态: pending',
        '- 优先级: P1',
        '',
        '### LQ-002',
        '- 状态: pending',
        '- 优先级: P2',
        '',
        '### LQ-003',
        '- 状态: processed',
        '- 优先级: P0',
        '',
      ].join('\n')
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.learningQueueCount).toBe(2);
    expect(state!.learningQueueTopPriority).toBe('P1');
  });

  it('returns null top priority when queue is empty', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'evolution', 'learning_queue.md'),
      '### LQ-001\n- 状态: processed\n- 优先级: P0\n'
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.learningQueueCount).toBe(0);
    expect(state!.learningQueueTopPriority).toBeNull();
  });

  it('counts knowledge base entries by ### KB- headers', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'evolution', 'knowledge_base.md'),
      '### KB-001\ncontent\n\n### KB-002\ncontent\n\n### KB-003\ncontent\n'
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.knowledgeBaseCount).toBe(3);
  });

  it('parses workflow success rate as average', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'evolution', 'workflow_metrics.md'),
      '- 成功率: 80%\n- 成功率: 60%\n- 成功率: 100%\n'
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.workflowSuccessRate).toBe(80);
  });

  it('returns null success rate when no metrics', () => {
    writeFileSync(
      join(TEST_DIR, '.omc', 'axiom', 'evolution', 'workflow_metrics.md'),
      '# Metrics\nNo data yet.\n'
    );
    const state = readAxiomStateForHud(TEST_DIR);
    expect(state!.workflowSuccessRate).toBeNull();
  });
});

// ============================================================================
// renderAxiom
// ============================================================================

describe('renderAxiom', () => {
  const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

  it('renders IDLE status', () => {
    const result = renderAxiom({
      status: 'IDLE',
      currentGoal: null,
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    expect(result).not.toBeNull();
    expect(strip(result!)).toContain('Axiom:就绪');
  });

  it('renders EXECUTING status', () => {
    const result = renderAxiom({
      status: 'EXECUTING',
      currentGoal: null,
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    expect(strip(result!)).toContain('Axiom:执行中');
  });

  it('renders BLOCKED status', () => {
    const result = renderAxiom({
      status: 'BLOCKED',
      currentGoal: null,
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    expect(strip(result!)).toContain('Axiom:已阻塞');
  });

  it('renders current goal truncated at 20 chars', () => {
    const result = renderAxiom({
      status: 'EXECUTING',
      currentGoal: '这是一个非常非常非常非常非常非常长的目标描述文字',
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    const stripped = strip(result!);
    expect(stripped).toContain('目标:');
    expect(stripped).toContain('…');
  });

  it('renders short goal without truncation', () => {
    const result = renderAxiom({
      status: 'IDLE',
      currentGoal: 'HUD重设计',
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    expect(strip(result!)).toContain('目标:HUD重设计');
    expect(strip(result!)).not.toContain('…');
  });

  it('renders task counts when non-zero', () => {
    const result = renderAxiom({
      status: 'EXECUTING',
      currentGoal: null,
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 2,
      pendingCount: 3,
    });
    const stripped = strip(result!);
    expect(stripped).toContain('任务:');
    expect(stripped).toContain('2');
    expect(stripped).toContain('3');
  });

  it('omits task counts when both are zero', () => {
    const result = renderAxiom({
      status: 'IDLE',
      currentGoal: null,
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    expect(strip(result!)).not.toContain('任务:');
  });

  it('renders learning queue with priority', () => {
    const result = renderAxiom({
      status: 'IDLE',
      currentGoal: null,
      learningQueueCount: 3,
      learningQueueTopPriority: 'P1',
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    const stripped = strip(result!);
    expect(stripped).toContain('学习队列:3条');
    expect(stripped).toContain('P1');
  });

  it('renders knowledge base count', () => {
    const result = renderAxiom({
      status: 'IDLE',
      currentGoal: null,
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 12,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    expect(strip(result!)).toContain('知识库:12条');
  });

  it('renders workflow success rate', () => {
    const result = renderAxiom({
      status: 'IDLE',
      currentGoal: null,
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: 85,
      inProgressCount: 0,
      pendingCount: 0,
    });
    expect(strip(result!)).toContain('成功率:85%');
  });

  it('omits success rate when null', () => {
    const result = renderAxiom({
      status: 'IDLE',
      currentGoal: null,
      learningQueueCount: 0,
      learningQueueTopPriority: null,
      knowledgeBaseCount: 0,
      workflowSuccessRate: null,
      inProgressCount: 0,
      pendingCount: 0,
    });
    expect(strip(result!)).not.toContain('成功率:');
  });
});

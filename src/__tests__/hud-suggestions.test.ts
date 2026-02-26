/**
 * OMC HUD - Smart Suggestions Element Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateSuggestions,
  renderSuggestions,
} from '../hud/elements/suggestions.js';
import type { AxiomStateForHud, SessionHealth } from '../hud/types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeAxiom(overrides: Partial<AxiomStateForHud> = {}): AxiomStateForHud {
  return {
    status: 'IDLE',
    currentGoal: null,
    learningQueueCount: 0,
    learningQueueTopPriority: null,
    knowledgeBaseCount: 0,
    workflowSuccessRate: null,
    inProgressCount: 0,
    pendingCount: 0,
    ...overrides,
  };
}

function makeHealth(overrides: Partial<SessionHealth> = {}): SessionHealth {
  return {
    durationMinutes: 30,
    messageCount: 10,
    health: 'healthy',
    ...overrides,
  };
}

const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

// ============================================================================
// generateSuggestions
// ============================================================================

describe('generateSuggestions', () => {
  it('returns empty array when no conditions met', () => {
    const result = generateSuggestions({
      contextPercent: 50,
      axiom: null,
      sessionHealth: null,
      activeAgentCount: 0,
      contextWarningThreshold: 75,
    });
    expect(result).toEqual([]);
  });

  describe('context suggestions', () => {
    it('suggests /compact at high priority when context >= 90%', () => {
      const result = generateSuggestions({
        contextPercent: 92,
        axiom: null,
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result).toHaveLength(1);
      expect(result[0].command).toBe('/compact');
      expect(result[0].priority).toBe('high');
    });

    it('suggests /compact at medium priority when context >= threshold', () => {
      const result = generateSuggestions({
        contextPercent: 80,
        axiom: null,
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result).toHaveLength(1);
      expect(result[0].command).toBe('/compact');
      expect(result[0].priority).toBe('medium');
    });

    it('does not suggest /compact below threshold', () => {
      const result = generateSuggestions({
        contextPercent: 60,
        axiom: null,
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result).toEqual([]);
    });
  });

  describe('Axiom state suggestions', () => {
    it('suggests /ax-analyze-error when BLOCKED', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: makeAxiom({ status: 'BLOCKED' }),
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.some(s => s.command === '/ax-analyze-error')).toBe(true);
      expect(result.find(s => s.command === '/ax-analyze-error')?.priority).toBe('high');
    });

    it('suggests /ax-evolve when IDLE with learning queue items', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: makeAxiom({ status: 'IDLE', learningQueueCount: 3, learningQueueTopPriority: 'P2' }),
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.some(s => s.command === '/ax-evolve')).toBe(true);
      expect(result.find(s => s.command === '/ax-evolve')?.priority).toBe('medium');
    });

    it('suggests /ax-evolve at high priority for P0/P1 queue items', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: makeAxiom({ status: 'IDLE', learningQueueCount: 2, learningQueueTopPriority: 'P0' }),
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.find(s => s.command === '/ax-evolve')?.priority).toBe('high');
    });

    it('suggests /ax-status when EXECUTING with no active agents', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: makeAxiom({ status: 'EXECUTING' }),
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.some(s => s.command === '/ax-status')).toBe(true);
    });

    it('does not suggest /ax-status when EXECUTING with active agents', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: makeAxiom({ status: 'EXECUTING' }),
        sessionHealth: null,
        activeAgentCount: 2,
        contextWarningThreshold: 75,
      });
      expect(result.some(s => s.command === '/ax-status')).toBe(false);
    });

    it('suggests /ax-implement when IDLE with pending tasks', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: makeAxiom({ status: 'IDLE', pendingCount: 5 }),
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.some(s => s.command === '/ax-implement')).toBe(true);
    });

    it('suggests /ax-reflect when IDLE with goal but no tasks', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: makeAxiom({ status: 'IDLE', currentGoal: '完成HUD重设计', inProgressCount: 0, pendingCount: 0 }),
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.some(s => s.command === '/ax-reflect')).toBe(true);
    });
  });

  describe('session health suggestions', () => {
    it('suggests /ax-suspend for critical long session', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: null,
        sessionHealth: makeHealth({ health: 'critical', durationMinutes: 150 }),
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.some(s => s.command === '/ax-suspend')).toBe(true);
    });

    it('does not suggest /ax-suspend for short critical session', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: null,
        sessionHealth: makeHealth({ health: 'critical', durationMinutes: 60 }),
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.some(s => s.command === '/ax-suspend')).toBe(false);
    });

    it('suggests /ax-suspend at high priority when cost > $4', () => {
      const result = generateSuggestions({
        contextPercent: 50,
        axiom: null,
        sessionHealth: makeHealth({ sessionCost: 5.0 }),
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      const suspend = result.find(s => s.command === '/ax-suspend');
      expect(suspend).toBeDefined();
      expect(suspend?.priority).toBe('high');
    });
  });

  describe('priority ordering and limit', () => {
    it('returns at most 2 suggestions', () => {
      const result = generateSuggestions({
        contextPercent: 92,
        axiom: makeAxiom({ status: 'BLOCKED', learningQueueCount: 3, learningQueueTopPriority: 'P0' }),
        sessionHealth: makeHealth({ sessionCost: 5.0 }),
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('sorts high priority before medium', () => {
      const result = generateSuggestions({
        contextPercent: 80,
        axiom: makeAxiom({ status: 'BLOCKED' }),
        sessionHealth: null,
        activeAgentCount: 0,
        contextWarningThreshold: 75,
      });
      if (result.length >= 2) {
        const priorities = result.map(s => s.priority);
        const order = { high: 0, medium: 1, low: 2 };
        expect(order[priorities[0]]).toBeLessThanOrEqual(order[priorities[1]]);
      }
    });
  });
});

// ============================================================================
// renderSuggestions
// ============================================================================

describe('renderSuggestions', () => {
  it('returns null for empty suggestions', () => {
    expect(renderSuggestions([])).toBeNull();
  });

  it('renders single suggestion with command and reason', () => {
    const result = renderSuggestions([
      { command: '/compact', reason: '上下文已用 90%', priority: 'high' },
    ]);
    expect(result).not.toBeNull();
    const stripped = strip(result!);
    expect(stripped).toContain('💡 建议:');
    expect(stripped).toContain('/compact');
    expect(stripped).toContain('上下文已用 90%');
  });

  it('renders two suggestions separated by |', () => {
    const result = renderSuggestions([
      { command: '/compact', reason: '上下文已用 90%', priority: 'high' },
      { command: '/ax-evolve', reason: '学习队列有3条', priority: 'medium' },
    ]);
    const stripped = strip(result!);
    expect(stripped).toContain('/compact');
    expect(stripped).toContain('/ax-evolve');
    expect(stripped).toContain('|');
  });
});

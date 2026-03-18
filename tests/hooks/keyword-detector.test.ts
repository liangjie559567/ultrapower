import { describe, it, expect } from 'vitest';
import { sanitizeForKeywordDetection, getAllKeywords } from '../../src/hooks/keyword-detector/index';
import { resolveConflict } from '../../src/hooks/keyword-detector/conflict-resolver';

describe('Keyword Detector - BUG-003 ReDoS', () => {
  it('should handle 10000 character input within 100ms', () => {
    const longText = 'a'.repeat(10000);
    const start = Date.now();
    const result = sanitizeForKeywordDetection(longText);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    expect(result.length).toBeLessThanOrEqual(10000);
  });

  it('should truncate input exceeding 50KB', () => {
    const hugeText = 'x'.repeat(60000);
    const result = sanitizeForKeywordDetection(hugeText);
    expect(result.length).toBeLessThanOrEqual(50000);
  });

  it('should handle deeply nested XML without timeout', () => {
    const depth = 1000;
    const nested = '<tag>'.repeat(depth) + 'content' + '</tag>'.repeat(depth);

    const start = Date.now();
    const result = sanitizeForKeywordDetection(nested);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    expect(result).toBeTruthy();
  });
});

describe('Keyword Detector - BUG-005 Conflict Resolution', () => {
  it('should allow ralph + ultrawork to coexist (non-conflicting)', () => {
    const result = resolveConflict(['ralph', 'ultrawork']);
    expect(result.hasConflict).toBe(false);
  });

  it('should resolve autopilot + ultrapilot conflict (ultrapilot wins)', () => {
    const result = resolveConflict(['autopilot', 'ultrapilot']);
    expect(result.hasConflict).toBe(true);
    expect(result.winner).toBe('ultrapilot');
    expect(result.loser).toBe('autopilot');
  });

  it('should resolve team + autopilot conflict (team wins)', () => {
    const result = resolveConflict(['team', 'autopilot']);
    expect(result.hasConflict).toBe(true);
    expect(result.winner).toBe('team');
    expect(result.loser).toBe('autopilot');
  });

  it('should return no conflict for single keyword', () => {
    const result = resolveConflict(['ralph']);
    expect(result.hasConflict).toBe(false);
  });

  it('should return no conflict for non-conflicting keywords', () => {
    const result = resolveConflict(['plan', 'tdd']);
    expect(result.hasConflict).toBe(false);
  });

  it('should apply conflict resolution in getAllKeywords', () => {
    const keywords = getAllKeywords('use ralph and ultrawork');
    expect(keywords).toContain('ralph');
    expect(keywords).toContain('ultrawork'); // ralph + ultrawork can coexist
  });
});

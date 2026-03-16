import { describe, it, expect } from 'vitest';
import { getAllKeywords } from '../../src/hooks/keyword-detector/index';
import { resolveConflict } from '../../dist/hooks/keyword-detector/conflict-resolver.js';

describe('BUG-005 关键词冲突解决', () => {
  describe('关键词检测基础功能', () => {
    it('should detect single keyword', () => {
      const result = getAllKeywords('ralph fix the bug');
      expect(result).toContain('ralph');
    });

    it('should detect multiple keywords', () => {
      const result = getAllKeywords('team ralph fix errors');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle no keywords', () => {
      const result = getAllKeywords('just normal text');
      expect(result).toEqual([]);
    });
  });

  describe('冲突解决', () => {
    it('should resolve ralph + ultrawork (ralph wins)', () => {
      const result = resolveConflict(['ralph', 'ultrawork']);
      expect(result.hasConflict).toBe(true);
      expect(result.winner).toBe('ralph');
      expect(result.loser).toBe('ultrawork');
    });

    it('should resolve autopilot + ultrapilot (ultrapilot wins)', () => {
      const result = resolveConflict(['autopilot', 'ultrapilot']);
      expect(result.hasConflict).toBe(true);
      expect(result.winner).toBe('ultrapilot');
      expect(result.loser).toBe('autopilot');
    });
  });
});

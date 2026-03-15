import { describe, it, expect } from 'vitest';
import { getAllKeywords } from '../../src/hooks/keyword-detector/index';

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

  describe('冲突提示准备', () => {
    it.skip('should resolve ralph + ultrawork (ralph wins) - pending T10', () => {
      // T10 未实现，跳过此测试
    });

    it.skip('should resolve autopilot + ultrapilot - pending T10', () => {
      // T10 未实现，跳过此测试
    });
  });
});

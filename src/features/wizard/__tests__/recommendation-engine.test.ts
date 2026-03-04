import { describe, it, expect } from 'vitest';
import { getRecommendation } from '../recommendation-engine.js';

describe('Recommendation Engine', () => {
  describe('单个功能路径', () => {
    it('简单 + 持续执行 -> ralph', () => {
      expect(getRecommendation('single', 'simple', 'continuous')).toBe('ralph');
    });

    it('简单 + 基本实现 -> executor', () => {
      expect(getRecommendation('single', 'simple', 'basic')).toBe('executor');
    });

    it('复杂 -> autopilot', () => {
      expect(getRecommendation('single', 'complex')).toBe('autopilot');
    });
  });

  describe('多个功能路径', () => {
    it('独立 -> ultrawork', () => {
      expect(getRecommendation('multiple', 'independent')).toBe('ultrawork');
    });

    it('不独立 -> team', () => {
      expect(getRecommendation('multiple', 'dependent')).toBe('team');
    });
  });

  describe('修复问题路径', () => {
    it('单文件 -> executor', () => {
      expect(getRecommendation('fix', 'single-file')).toBe('executor');
    });

    it('多文件 + 验证循环 -> ralph', () => {
      expect(getRecommendation('fix', 'multi-file', 'verify-loop')).toBe('ralph');
    });

    it('多文件 + 一次修复 -> ultrawork', () => {
      expect(getRecommendation('fix', 'multi-file', 'one-time')).toBe('ultrawork');
    });
  });

  describe('不确定路径', () => {
    it('需要规划 -> plan', () => {
      expect(getRecommendation('uncertain', 'need-plan')).toBe('plan');
    });

    it('不需要规划 -> restart', () => {
      expect(getRecommendation('uncertain', 'no-plan')).toBe('restart');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { analyzeLibrary } from '../../../src/agents/zerodev/opensource-analyzer';
import { InputError, ValidationError } from '../../../src/agents/zerodev/types';

describe('opensource-analyzer Agent', () => {
  describe('开源库分析', () => {
    it('应该分析 MIT 许可证库', () => {
      const analysis = analyzeLibrary('react', 'MIT');
      expect(analysis.license).toBe('MIT');
      expect(analysis.compatible).toBe(true);
      expect(analysis.risk).toBe('low');
    });

    it('应该检测 GPL 许可证风险', () => {
      const analysis = analyzeLibrary('some-gpl-library', 'MIT');
      expect(analysis.license).toBe('GPL');
      expect(analysis.compatible).toBe(false);
      expect(analysis.risk).toBe('high');
    });

    it('应该分析 Apache 许可证', () => {
      const analysis = analyzeLibrary('apache-commons', 'MIT');
      expect(analysis.license).toBe('Apache-2.0');
      expect(analysis.risk).toBe('low');
    });

    it('应该拒绝空库名', () => {
      expect(() => analyzeLibrary('')).toThrow(InputError);
    });

    it('应该拒绝超长库名', () => {
      expect(() => analyzeLibrary('a'.repeat(201))).toThrow(ValidationError);
    });
  });
});

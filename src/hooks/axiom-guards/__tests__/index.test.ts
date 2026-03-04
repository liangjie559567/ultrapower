import { describe, it, expect } from 'vitest';
import { processAxiomGuards, checkExpertGate, getExpertGateMessage } from '../index.js';

describe('axiom-guards hook', () => {
  describe('processAxiomGuards', () => {
    it('should not block non-write tools', () => {
      const result = processAxiomGuards({
        toolName: 'Read',
        toolInput: { file_path: 'test.ts' }
      });
      expect(result.blocked).toBe(false);
      expect(result.suggestion).toBeUndefined();
    });

    it('should suggest CI gate for TS/JS writes', () => {
      const result = processAxiomGuards({
        toolName: 'Write',
        toolInput: { file_path: 'src/index.ts' }
      });
      expect(result.blocked).toBe(false);
      expect(result.suggestion).toContain('tsc --noEmit');
    });

    it('should not suggest CI gate for non-code files', () => {
      const result = processAxiomGuards({
        toolName: 'Write',
        toolInput: { file_path: 'README.md' }
      });
      expect(result.blocked).toBe(false);
      expect(result.suggestion).toBeUndefined();
    });
  });

  describe('checkExpertGate', () => {
    it('should detect new feature keywords', () => {
      expect(checkExpertGate('添加新功能')).toBe(true);
      expect(checkExpertGate('实现登录')).toBe(true);
      expect(checkExpertGate('修复bug')).toBe(false);
    });
  });

  describe('getExpertGateMessage', () => {
    it('should return expert gate message', () => {
      const msg = getExpertGateMessage();
      expect(msg).toContain('/ax-draft');
    });
  });
});

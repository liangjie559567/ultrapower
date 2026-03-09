import { describe, it, expect } from 'vitest';
import { optimizePromptText, optimizeContextFiles, estimateTokens, optimizePrompt } from '../index';

describe('Prompt Optimizer', () => {
  describe('optimizePromptText', () => {
    it('should remove redundant phrases', () => {
      const result = optimizePromptText('Could you please analyze this code');
      expect(result.text).toBe('analyze this code');
      expect(result.changes).toContain('移除冗余短语');
    });

    it('should remove help me phrases', () => {
      const result = optimizePromptText('analyze this code and help me understand it');
      expect(result.text).toBe('analyze this code');
      expect(result.changes).toContain('移除冗余短语');
    });

    it('should simplify instructions', () => {
      const result = optimizePromptText('Please summarize the following document');
      expect(result.text).toBe('Summarize document');
    });
  });

  describe('optimizeContextFiles', () => {
    it('should prioritize interface files', () => {
      const files = ['src/index.ts', 'src/types.d.ts', 'src/utils.ts'];
      const result = optimizeContextFiles(files, { preferInterfaces: true });
      expect(result.files[0]).toBe('src/types.d.ts');
    });

    it('should limit file count', () => {
      const files = Array.from({ length: 10 }, (_, i) => `file${i}.ts`);
      const result = optimizeContextFiles(files, { maxContextFiles: 3 });
      expect(result.files).toHaveLength(3);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens correctly', () => {
      const text = 'Hello world';
      const tokens = estimateTokens(text);
      expect(tokens).toBe(3);
    });
  });

  describe('optimizePrompt', () => {
    it('should optimize both prompt and context files', () => {
      const result = optimizePrompt(
        'Could you please analyze this',
        ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts'],
        { maxContextFiles: 3 }
      );
      expect(result.prompt).toBe('analyze this');
      expect(result.contextFiles).toHaveLength(3);
      expect(result.optimizations.length).toBeGreaterThan(0);
    });
  });
});

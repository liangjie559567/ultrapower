import { describe, it, expect } from 'vitest';
import {
  shouldApplyRule,
  isDuplicateByRealPath,
  createContentHash,
  isDuplicateByContentHash,
} from '../matcher.js';
import type { RuleMetadata } from '../types.js';

describe('Rules Matcher', () => {
  describe('shouldApplyRule', () => {
    it('applies rule when alwaysApply is true', () => {
      const metadata: RuleMetadata = { alwaysApply: true };
      const result = shouldApplyRule(metadata, '/any/file.ts', '/project');

      expect(result.applies).toBe(true);
      expect(result.reason).toBe('alwaysApply');
    });

    it('does not apply when no globs defined', () => {
      const metadata: RuleMetadata = {};
      const result = shouldApplyRule(metadata, '/project/src/file.ts', '/project');

      expect(result.applies).toBe(false);
    });

    it('does not apply when globs array is empty', () => {
      const metadata: RuleMetadata = { globs: [] };
      const result = shouldApplyRule(metadata, '/project/src/file.ts', '/project');

      expect(result.applies).toBe(false);
    });

    it('matches single glob pattern', () => {
      const metadata: RuleMetadata = { globs: '**/*.ts' };
      const result = shouldApplyRule(metadata, '/project/src/file.ts', '/project');

      expect(result.applies).toBe(true);
      expect(result.reason).toBe('glob: **/*.ts');
    });

    it('matches array of glob patterns', () => {
      const metadata: RuleMetadata = { globs: ['**/*.ts', 'src/**/*.js'] };
      const result = shouldApplyRule(metadata, '/project/src/utils/helper.js', '/project');

      expect(result.applies).toBe(true);
      expect(result.reason).toBe('glob: src/**/*.js');
    });

    it('does not match when pattern does not match', () => {
      const metadata: RuleMetadata = { globs: '**/*.py' };
      const result = shouldApplyRule(metadata, '/project/src/file.ts', '/project');

      expect(result.applies).toBe(false);
    });

    it('matches with wildcard patterns', () => {
      const metadata: RuleMetadata = { globs: '*.ts' };
      const result = shouldApplyRule(metadata, '/project/file.ts', '/project');

      expect(result.applies).toBe(true);
    });

    it('handles null projectRoot', () => {
      const metadata: RuleMetadata = { globs: '**/*.ts' };
      const result = shouldApplyRule(metadata, '/absolute/path/file.ts', null);

      expect(result.applies).toBe(true);
    });
  });

  describe('isDuplicateByRealPath', () => {
    it('returns true when path exists in cache', () => {
      const cache = new Set(['/real/path/file.ts']);
      expect(isDuplicateByRealPath('/real/path/file.ts', cache)).toBe(true);
    });

    it('returns false when path does not exist in cache', () => {
      const cache = new Set(['/real/path/file.ts']);
      expect(isDuplicateByRealPath('/other/path/file.ts', cache)).toBe(false);
    });
  });

  describe('createContentHash', () => {
    it('creates 16-character hash', () => {
      const hash = createContentHash('test content');
      expect(hash).toHaveLength(16);
    });

    it('creates consistent hash for same content', () => {
      const hash1 = createContentHash('test content');
      const hash2 = createContentHash('test content');
      expect(hash1).toBe(hash2);
    });

    it('creates different hash for different content', () => {
      const hash1 = createContentHash('content A');
      const hash2 = createContentHash('content B');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isDuplicateByContentHash', () => {
    it('returns true when hash exists in cache', () => {
      const cache = new Set(['abc123']);
      expect(isDuplicateByContentHash('abc123', cache)).toBe(true);
    });

    it('returns false when hash does not exist in cache', () => {
      const cache = new Set(['abc123']);
      expect(isDuplicateByContentHash('def456', cache)).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { parseRuleFrontmatter } from '../parser.js';

describe('Rules Parser', () => {
  describe('parseRuleFrontmatter', () => {
    it('parses content without frontmatter', () => {
      const content = '# Rule Content\nSome text';
      const result = parseRuleFrontmatter(content);

      expect(result.metadata).toEqual({});
      expect(result.body).toBe(content);
    });

    it('parses basic frontmatter with description', () => {
      const content = `---
description: Test rule
---
# Rule body`;
      const result = parseRuleFrontmatter(content);

      expect(result.metadata.description).toBe('Test rule');
      expect(result.body).toBe('# Rule body');
    });

    it('parses alwaysApply boolean', () => {
      const content = `---
alwaysApply: true
---
Body`;
      const result = parseRuleFrontmatter(content);

      expect(result.metadata.alwaysApply).toBe(true);
    });

    it('parses single glob string', () => {
      const content = `---
globs: "**/*.ts"
---
Body`;
      const result = parseRuleFrontmatter(content);

      expect(result.metadata.globs).toBe('**/*.ts');
    });

    it('parses inline array globs', () => {
      const content = `---
globs: ["**/*.ts", "**/*.js"]
---
Body`;
      const result = parseRuleFrontmatter(content);

      expect(Array.isArray(result.metadata.globs)).toBe(true);
      expect(result.metadata.globs).toEqual(['**/*.ts', '**/*.js']);
    });

    it('parses multi-line array globs', () => {
      const content = `---
globs:
  - "**/*.ts"
  - "**/*.js"
---
Body`;
      const result = parseRuleFrontmatter(content);

      expect(Array.isArray(result.metadata.globs)).toBe(true);
      expect(result.metadata.globs).toEqual(['**/*.ts', '**/*.js']);
    });

    it('parses comma-separated globs', () => {
      const content = `---
globs: "**/*.ts, **/*.js"
---
Body`;
      const result = parseRuleFrontmatter(content);

      expect(Array.isArray(result.metadata.globs)).toBe(true);
      expect(result.metadata.globs).toEqual(['**/*.ts', '**/*.js']);
    });

    it('merges paths into globs for Claude Code compatibility', () => {
      const content = `---
globs: "**/*.ts"
paths: "**/*.js"
---
Body`;
      const result = parseRuleFrontmatter(content);

      expect(Array.isArray(result.metadata.globs)).toBe(true);
      expect(result.metadata.globs).toEqual(['**/*.ts', '**/*.js']);
    });

    it('handles invalid frontmatter gracefully', () => {
      const content = `---
invalid yaml content {{{
---
Body`;
      const result = parseRuleFrontmatter(content);

      expect(result.metadata).toEqual({});
      expect(result.body).toBe('Body');
    });
  });
});

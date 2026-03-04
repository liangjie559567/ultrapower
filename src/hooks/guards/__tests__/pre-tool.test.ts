import { describe, it, expect } from 'vitest';
import { checkPreTool, isRestrictedTool } from '../pre-tool.js';

describe('pre-tool guards', () => {
  describe('checkPreTool', () => {
    it('should allow safe bash commands', () => {
      const result = checkPreTool({
        toolName: 'Bash',
        toolInput: { command: 'ls -la' },
      });
      expect(result.allowed).toBe(true);
    });

    it('should block rm -rf commands', () => {
      const result = checkPreTool({
        toolName: 'Bash',
        toolInput: { command: 'rm -rf /' },
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Dangerous command');
    });

    it('should block git push --force', () => {
      const result = checkPreTool({
        toolName: 'Bash',
        toolInput: { command: 'git push --force origin main' },
      });
      expect(result.allowed).toBe(false);
    });

    it('should block git reset --hard', () => {
      const result = checkPreTool({
        toolName: 'Bash',
        toolInput: { command: 'git reset --hard HEAD~1' },
      });
      expect(result.allowed).toBe(false);
    });

    it('should block DROP TABLE SQL', () => {
      const result = checkPreTool({
        toolName: 'Bash',
        toolInput: { command: 'psql -c "DROP TABLE users"' },
      });
      expect(result.allowed).toBe(false);
    });

    it('should allow Write to project files', () => {
      const result = checkPreTool({
        toolName: 'Write',
        toolInput: { file_path: 'src/test.ts' },
      });
      expect(result.allowed).toBe(true);
    });

    it('should block Write to .claude directory', () => {
      const result = checkPreTool({
        toolName: 'Write',
        toolInput: { file_path: `${process.env.HOME}/.claude/config.json` },
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('restricted path');
    });

    it('should block Write to node_modules', () => {
      const result = checkPreTool({
        toolName: 'Write',
        toolInput: { file_path: 'node_modules/package/index.js' },
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe('isRestrictedTool', () => {
    it('should identify Bash as restricted', () => {
      expect(isRestrictedTool('Bash')).toBe(true);
    });

    it('should identify Write as restricted', () => {
      expect(isRestrictedTool('Write')).toBe(true);
    });

    it('should identify Edit as restricted', () => {
      expect(isRestrictedTool('Edit')).toBe(true);
    });

    it('should not identify Read as restricted', () => {
      expect(isRestrictedTool('Read')).toBe(false);
    });
  });
});

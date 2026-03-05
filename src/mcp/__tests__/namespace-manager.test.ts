import { describe, it, expect } from 'vitest';
import { addNamespace, parseNamespace, isNamespaced } from '../namespace-manager.js';

describe('Namespace Manager', () => {
  describe('addNamespace', () => {
    it('should add namespace prefix', () => {
      expect(addNamespace('filesystem', 'read_file')).toBe('mcp__filesystem__read_file');
      expect(addNamespace('github', 'create_issue')).toBe('mcp__github__create_issue');
    });
  });

  describe('parseNamespace', () => {
    it('should parse valid namespaced names', () => {
      expect(parseNamespace('mcp__filesystem__read_file')).toEqual({
        serverName: 'filesystem',
        toolName: 'read_file'
      });
      expect(parseNamespace('mcp__github__create_issue')).toEqual({
        serverName: 'github',
        toolName: 'create_issue'
      });
    });

    it('should return null for invalid names', () => {
      expect(parseNamespace('read_file')).toBeNull();
      expect(parseNamespace('mcp__filesystem')).toBeNull();
      expect(parseNamespace('filesystem__read_file')).toBeNull();
    });
  });

  describe('isNamespaced', () => {
    it('should detect namespaced names', () => {
      expect(isNamespaced('mcp__filesystem__read_file')).toBe(true);
      expect(isNamespaced('mcp__github__create_issue')).toBe(true);
    });

    it('should reject non-namespaced names', () => {
      expect(isNamespaced('read_file')).toBe(false);
      expect(isNamespaced('mcp__filesystem')).toBe(false);
      expect(isNamespaced('filesystem__read_file')).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  isValidAgentRoleName,
  getValidAgentRoles,
  resolveSystemPrompt,
  buildPromptWithSystemContext,
  wrapUntrustedFileContent,
  wrapUntrustedCliResponse
} from '../prompt-injection.js';

describe('Prompt Injection', () => {
  describe('isValidAgentRoleName', () => {
    it('accepts valid role names', () => {
      expect(isValidAgentRoleName('architect')).toBe(true);
      expect(isValidAgentRoleName('test-engineer')).toBe(true);
      expect(isValidAgentRoleName('executor-low')).toBe(true);
    });

    it('rejects invalid characters', () => {
      expect(isValidAgentRoleName('Architect')).toBe(false);
      expect(isValidAgentRoleName('test_engineer')).toBe(false);
      expect(isValidAgentRoleName('role/name')).toBe(false);
      expect(isValidAgentRoleName('../../../etc/passwd')).toBe(false);
    });
  });

  describe('getValidAgentRoles', () => {
    it('returns array of roles', () => {
      const roles = getValidAgentRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    });

    it('caches results', () => {
      const first = getValidAgentRoles();
      const second = getValidAgentRoles();
      expect(first).toBe(second);
    });
  });

  describe('resolveSystemPrompt', () => {
    it('prefers explicit system_prompt', () => {
      const result = resolveSystemPrompt('Custom prompt', 'architect');
      expect(result).toBe('Custom prompt');
    });

    it('falls back to agent_role', () => {
      const result = resolveSystemPrompt(undefined, 'architect');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('returns undefined when both missing', () => {
      const result = resolveSystemPrompt(undefined, undefined);
      expect(result).toBeUndefined();
    });

    it('trims whitespace', () => {
      const result = resolveSystemPrompt('  prompt  ', undefined);
      expect(result).toBe('prompt');
    });
  });

  describe('buildPromptWithSystemContext', () => {
    it('builds prompt with all sections', () => {
      const result = buildPromptWithSystemContext(
        'User query',
        'File content',
        'System instructions'
      );
      expect(result).toContain('<system-instructions>');
      expect(result).toContain('System instructions');
      expect(result).toContain('UNTRUSTED DATA');
      expect(result).toContain('File content');
      expect(result).toContain('User query');
    });

    it('builds prompt without system', () => {
      const result = buildPromptWithSystemContext('User query', 'Files', undefined);
      expect(result).not.toContain('<system-instructions>');
      expect(result).toContain('User query');
    });

    it('builds prompt without files', () => {
      const result = buildPromptWithSystemContext('User query', undefined, 'System');
      expect(result).toContain('<system-instructions>');
      expect(result).not.toContain('UNTRUSTED');
    });
  });

  describe('wrapUntrustedFileContent', () => {
    it('wraps content with delimiters', () => {
      const result = wrapUntrustedFileContent('test.ts', 'code');
      expect(result).toContain('UNTRUSTED FILE CONTENT');
      expect(result).toContain('test.ts');
      expect(result).toContain('code');
      expect(result).toContain('END UNTRUSTED FILE CONTENT');
    });
  });

  describe('wrapUntrustedCliResponse', () => {
    it('wraps CLI response with metadata', () => {
      const result = wrapUntrustedCliResponse('output', { source: 'codex', tool: 'ask_codex' });
      expect(result).toContain('UNTRUSTED CLI RESPONSE');
      expect(result).toContain('ask_codex:codex');
      expect(result).toContain('output');
    });
  });
});

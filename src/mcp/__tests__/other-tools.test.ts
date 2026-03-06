import { describe, it, expect } from 'vitest';
import { omcToolNames } from '../omc-tools-server.js';

describe('Other Tool Categories', () => {
  describe('AST Tools', () => {
    it('exposes ast_grep_search', () => {
      expect(omcToolNames).toContain('mcp__t__ast_grep_search');
    });

    it('exposes ast_grep_replace', () => {
      expect(omcToolNames).toContain('mcp__t__ast_grep_replace');
    });
  });

  describe('Python Tools', () => {
    it('exposes python_repl', () => {
      expect(omcToolNames).toContain('mcp__t__python_repl');
    });
  });

  describe('Notepad Tools', () => {
    it('exposes notepad_read', () => {
      expect(omcToolNames).toContain('mcp__t__notepad_read');
    });
  });

  describe('State Tools', () => {
    it('exposes state_read', () => {
      expect(omcToolNames).toContain('mcp__t__state_read');
    });
  });

  describe('ProjectMemory Tools', () => {
    it('exposes mem_read', () => {
      expect(omcToolNames).toContain('mcp__t__mem_read');
    });
  });

  describe('Trace Tools', () => {
    it('exposes trace_timeline', () => {
      expect(omcToolNames).toContain('mcp__t__trace_timeline');
    });
  });

  describe('Skills Tools', () => {
    it('exposes list_skills', () => {
      expect(omcToolNames).toContain('mcp__t__list_skills');
    });
  });
});

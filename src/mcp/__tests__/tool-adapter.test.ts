import { describe, it, expect } from 'vitest';
import { astTools } from '../adapters/ast-adapter.js';
import { pythonTools } from '../adapters/python-adapter.js';
import { skillsTools } from '../adapters/skills-adapter.js';
import { traceTools } from '../adapters/trace-adapter.js';

describe('Tool Adapters', () => {
  describe('AST Tools', () => {
    it('exports ast_grep_search tool', () => {
      const tool = astTools.find(t => t.name === 'ast_grep_search');
      expect(tool).toBeDefined();
      expect(tool?.description).toBeTruthy();
      expect(tool?.inputSchema.type).toBe('object');
      expect(tool?.inputSchema.required).toContain('pattern');
      expect(tool?.handler).toBeTypeOf('function');
    });

    it('exports ast_grep_replace tool', () => {
      const tool = astTools.find(t => t.name === 'ast_grep_replace');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('replacement');
    });
  });

  describe('Python Tools', () => {
    it('exports python_repl tool', () => {
      const tool = pythonTools.find(t => t.name === 'python_repl');
      expect(tool).toBeDefined();
      expect(tool?.description).toBeTruthy();
      expect(tool?.inputSchema.type).toBe('object');
    });
  });

  describe('Skills Tools', () => {
    it('exports skills tools array', () => {
      expect(Array.isArray(skillsTools)).toBe(true);
      expect(skillsTools.length).toBeGreaterThan(0);
    });

    it('all skills tools have required properties', () => {
      skillsTools.forEach(tool => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.handler).toBeTypeOf('function');
      });
    });
  });

  describe('Trace Tools', () => {
    it('exports trace tools array', () => {
      expect(Array.isArray(traceTools)).toBe(true);
      expect(traceTools.length).toBeGreaterThan(0);
    });

    it('all trace tools have valid schemas', () => {
      traceTools.forEach(tool => {
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });
});

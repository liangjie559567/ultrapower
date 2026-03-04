import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseDisabledGroups, getOmcToolNames, DISABLE_TOOLS_GROUP_MAP } from '../omc-tools-server.js';
import { TOOL_CATEGORIES } from '../../constants/index.js';

describe('parseDisabledGroups', () => {
  const originalEnv = process.env.OMC_DISABLE_TOOLS;

  afterEach(() => {
    process.env.OMC_DISABLE_TOOLS = originalEnv;
  });

  it('returns empty set for undefined input', () => {
    const result = parseDisabledGroups(undefined);
    expect(result.size).toBe(0);
  });

  it('returns empty set for empty string', () => {
    const result = parseDisabledGroups('');
    expect(result.size).toBe(0);
  });

  it('parses single group name', () => {
    const result = parseDisabledGroups('lsp');
    expect(result.has(TOOL_CATEGORIES.LSP)).toBe(true);
    expect(result.size).toBe(1);
  });

  it('parses multiple group names', () => {
    const result = parseDisabledGroups('lsp,python,memory');
    expect(result.has(TOOL_CATEGORIES.LSP)).toBe(true);
    expect(result.has(TOOL_CATEGORIES.PYTHON)).toBe(true);
    expect(result.has(TOOL_CATEGORIES.MEMORY)).toBe(true);
    expect(result.size).toBe(3);
  });

  it('handles whitespace in group names', () => {
    const result = parseDisabledGroups(' lsp , python , memory ');
    expect(result.size).toBe(3);
  });

  it('is case-insensitive', () => {
    const result = parseDisabledGroups('LSP,Python,MEMORY');
    expect(result.has(TOOL_CATEGORIES.LSP)).toBe(true);
    expect(result.has(TOOL_CATEGORIES.PYTHON)).toBe(true);
    expect(result.has(TOOL_CATEGORIES.MEMORY)).toBe(true);
  });

  it('ignores unknown group names', () => {
    const result = parseDisabledGroups('lsp,unknown,python');
    expect(result.size).toBe(2);
    expect(result.has(TOOL_CATEGORIES.LSP)).toBe(true);
    expect(result.has(TOOL_CATEGORIES.PYTHON)).toBe(true);
  });

  it('handles alias names', () => {
    const result = parseDisabledGroups('python-repl,project-memory');
    expect(result.has(TOOL_CATEGORIES.PYTHON)).toBe(true);
    expect(result.has(TOOL_CATEGORIES.MEMORY)).toBe(true);
  });

  it('reads from process.env when no argument provided', () => {
    process.env.OMC_DISABLE_TOOLS = 'lsp,ast';
    const result = parseDisabledGroups();
    expect(result.has(TOOL_CATEGORIES.LSP)).toBe(true);
    expect(result.has(TOOL_CATEGORIES.AST)).toBe(true);
  });
});

describe('getOmcToolNames', () => {
  it('returns all tools when no options provided', () => {
    const result = getOmcToolNames();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(name => name.startsWith('mcp__t__'))).toBe(true);
  });

  it('excludes LSP tools when includeLsp is false', () => {
    const result = getOmcToolNames({ includeLsp: false });
    expect(result.every(name => !name.includes('lsp_'))).toBe(true);
  });

  it('excludes AST tools when includeAst is false', () => {
    const result = getOmcToolNames({ includeAst: false });
    expect(result.every(name => !name.includes('ast_grep'))).toBe(true);
  });

  it('excludes Python tools when includePython is false', () => {
    const result = getOmcToolNames({ includePython: false });
    expect(result.every(name => !name.includes('python_repl'))).toBe(true);
  });

  it('excludes multiple categories', () => {
    const result = getOmcToolNames({ includeLsp: false, includeAst: false });
    expect(result.every(name => !name.includes('lsp_') && !name.includes('ast_grep'))).toBe(true);
  });

  it('excludes State tools when includeState is false', () => {
    const result = getOmcToolNames({ includeState: false });
    expect(result.every(name => !name.includes('state_'))).toBe(true);
  });

  it('excludes Notepad tools when includeNotepad is false', () => {
    const result = getOmcToolNames({ includeNotepad: false });
    expect(result.every(name => !name.includes('notepad_'))).toBe(true);
  });

  it('excludes Memory tools when includeMemory is false', () => {
    const result = getOmcToolNames({ includeMemory: false });
    expect(result.every(name => !name.includes('project_memory_'))).toBe(true);
  });

  it('excludes Trace tools when includeTrace is false', () => {
    const result = getOmcToolNames({ includeTrace: false });
    expect(result.every(name => !name.includes('trace_'))).toBe(true);
  });
});

describe('DISABLE_TOOLS_GROUP_MAP', () => {
  it('maps all canonical names', () => {
    expect(DISABLE_TOOLS_GROUP_MAP['lsp']).toBe(TOOL_CATEGORIES.LSP);
    expect(DISABLE_TOOLS_GROUP_MAP['ast']).toBe(TOOL_CATEGORIES.AST);
    expect(DISABLE_TOOLS_GROUP_MAP['python']).toBe(TOOL_CATEGORIES.PYTHON);
    expect(DISABLE_TOOLS_GROUP_MAP['skills']).toBe(TOOL_CATEGORIES.SKILLS);
  });

  it('maps alias names', () => {
    expect(DISABLE_TOOLS_GROUP_MAP['python-repl']).toBe(TOOL_CATEGORIES.PYTHON);
    expect(DISABLE_TOOLS_GROUP_MAP['project-memory']).toBe(TOOL_CATEGORIES.MEMORY);
  });
});

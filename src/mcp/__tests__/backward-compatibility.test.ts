import { describe, it, expect } from 'vitest';
import { omcToolNames } from '../omc-tools-server.js';

describe('Backward Compatibility', () => {
  it('exposes tools with mcp__t__ prefix', () => {
    const newPrefixTools = omcToolNames.filter(name => name.startsWith('mcp__t__'));
    expect(newPrefixTools.length).toBeGreaterThan(0);
  });

  it('all tools use consistent mcp__t__ prefix', () => {
    const allHavePrefix = omcToolNames.every(name => name.startsWith('mcp__t__'));
    expect(allHavePrefix).toBe(true);
  });

  it('tool names are accessible', () => {
    expect(omcToolNames).toContain('mcp__t__lsp_hover');
    expect(omcToolNames).toContain('mcp__t__ast_grep_search');
    expect(omcToolNames).toContain('mcp__t__python_repl');
  });
});

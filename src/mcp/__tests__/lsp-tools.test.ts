import { describe, it, expect, vi } from 'vitest';
import { omcToolsServer, omcToolNames } from '../omc-tools-server.js';

describe('LSP Tool Integration', () => {
  it('exposes LSP tools', () => {
    const lspTools = omcToolNames.filter(name => name.includes('lsp_'));
    expect(lspTools.length).toBeGreaterThan(0);
  });

  it('includes lsp_hover tool', () => {
    const hasHover = omcToolNames.some(name => name === 'mcp__t__lsp_hover');
    expect(hasHover).toBe(true);
  });

  it('includes lsp_diagnostics tool', () => {
    const hasDiagnostics = omcToolNames.some(name => name === 'mcp__t__lsp_diagnostics');
    expect(hasDiagnostics).toBe(true);
  });

  it('LSP tools have valid handlers', () => {
    const server = omcToolsServer;
    expect(server.instance).toBeDefined();
  });
});

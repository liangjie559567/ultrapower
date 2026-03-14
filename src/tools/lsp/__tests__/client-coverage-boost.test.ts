/**
 * LSP Client Coverage Boost - Simple non-async tests
 */

import { describe, it, expect } from 'vitest';
import { LspClient, lspClientManager } from '../client.js';

describe('LspClient - Simple Coverage', () => {
  it('closeDocument for unopened file does not throw', () => {
    const client = new LspClient('/w', { command: 'lsp', args: [], initializationOptions: {} });
    expect(() => client.closeDocument('/w/file.ts')).not.toThrow();
  });

  it('getDiagnostics returns empty array for unknown file', () => {
    const client = new LspClient('/w', { command: 'lsp', args: [], initializationOptions: {} });
    expect(client.getDiagnostics('/w/file.ts')).toEqual([]);
  });
});

describe('LspClientManager - Simple Coverage', () => {
  it('getInFlightCount returns 0 for unknown key', () => {
    expect(lspClientManager.getInFlightCount('unknown')).toBe(0);
  });

  it('clientCount returns number', () => {
    expect(typeof lspClientManager.clientCount).toBe('number');
  });

  it('getCachedSymbols returns null for unknown key', () => {
    expect(lspClientManager.getCachedSymbols('unknown')).toBeNull();
  });

  it('triggerEviction does not throw', () => {
    expect(() => lspClientManager.triggerEviction()).not.toThrow();
  });
});

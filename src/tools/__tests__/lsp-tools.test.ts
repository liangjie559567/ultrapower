import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  lspHoverTool,
  lspGotoDefinitionTool,
  lspFindReferencesTool,
  lspDocumentSymbolsTool,
  lspWorkspaceSymbolsTool,
  lspDiagnosticsTool,
  lspServersTool,
  lspPrepareRenameTool,
  lspRenameTool,
  lspCodeActionsTool,
  lspCodeActionResolveTool,
  lspDiagnosticsDirectoryTool
} from '../lsp-tools.js';
import * as lspIndex from '../lsp/index.js';
import * as diagnosticsIndex from '../diagnostics/index.js';

vi.mock('../lsp/index.js');
vi.mock('../diagnostics/index.js');

describe('lsp-tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lspHoverTool', () => {
    it('returns hover information when server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          hover: vi.fn().mockResolvedValue({ contents: 'type: string' })
        };
        return fn(mockClient as any);
      });
      vi.mocked(lspIndex.formatHover).mockReturnValue('Hover: type: string');

      const result = await lspHoverTool.handler({ file: 'test.ts', line: 10, character: 5 });

      expect(result.content[0].text).toBe('Hover: type: string');
      expect(lspIndex.lspClientManager.runWithClientLease).toHaveBeenCalledWith('test.ts', expect.any(Function));
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspHoverTool.handler({ file: 'test.unknown', line: 1, character: 0 });

      expect(result.content[0].text).toContain('No language server available');
    });

    it('handles LSP client errors gracefully', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockRejectedValue(new Error('Connection failed'));

      const result = await lspHoverTool.handler({ file: 'test.ts', line: 1, character: 0 });

      expect(result.content[0].text).toContain('Error in hover');
      expect(result.content[0].text).toContain('Connection failed');
    });
  });

  describe('lspGotoDefinitionTool', () => {
    it('returns definition location when found', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          definition: vi.fn().mockResolvedValue([{ uri: 'file:///test.ts', range: { start: { line: 5, character: 0 } } }])
        };
        return fn(mockClient as any);
      });
      vi.mocked(lspIndex.formatLocations).mockReturnValue('Definition: test.ts:5:0');

      const result = await lspGotoDefinitionTool.handler({ file: 'test.ts', line: 10, character: 5 });

      expect(result.content[0].text).toBe('Definition: test.ts:5:0');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspGotoDefinitionTool.handler({ file: 'test.unknown', line: 1, character: 0 });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspFindReferencesTool', () => {
    it('returns references when found', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          references: vi.fn().mockResolvedValue([{ uri: 'file:///test.ts', range: { start: { line: 5, character: 0 } } }])
        };
        return fn(mockClient as any);
      });
      vi.mocked(lspIndex.formatLocations).mockReturnValue('test.ts:5:0');

      const result = await lspFindReferencesTool.handler({ file: 'test.ts', line: 10, character: 5, includeDeclaration: true });

      expect(result.content[0].text).toContain('test.ts:5:0');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspFindReferencesTool.handler({ file: 'test.unknown', line: 1, character: 0 });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspDocumentSymbolsTool', () => {
    it('returns document symbols when found', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          documentSymbols: vi.fn().mockResolvedValue([{ name: 'testFunction', kind: 12 }])
        };
        return fn(mockClient as any);
      });
      vi.mocked(lspIndex.formatDocumentSymbols).mockReturnValue('Symbols: testFunction');

      const result = await lspDocumentSymbolsTool.handler({ file: 'test.ts' });

      expect(result.content[0].text).toBe('Symbols: testFunction');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspDocumentSymbolsTool.handler({ file: 'test.unknown' });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspWorkspaceSymbolsTool', () => {
    it('returns workspace symbols when found', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          workspaceSymbols: vi.fn().mockResolvedValue([{ name: 'testFunction', kind: 12 }])
        };
        return fn(mockClient as any);
      });
      vi.mocked(lspIndex.formatWorkspaceSymbols).mockReturnValue('Symbols: testFunction');

      const result = await lspWorkspaceSymbolsTool.handler({ query: 'test', file: 'test.ts' });

      expect(result.content[0].text).toContain('Symbols: testFunction');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspWorkspaceSymbolsTool.handler({ query: 'test', file: 'test.unknown' });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspDiagnosticsTool', () => {
    it('returns diagnostics when found', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          openDocument: vi.fn(),
          getDiagnostics: vi.fn().mockReturnValue([{ severity: 1, message: 'Error' }])
        };
        return fn(mockClient as any);
      });
      vi.mocked(lspIndex.formatDiagnostics).mockReturnValue('Diagnostics: Error');

      const result = await lspDiagnosticsTool.handler({ file: 'test.ts' });

      expect(result.content[0].text).toContain('Diagnostics: Error');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspDiagnosticsTool.handler({ file: 'test.unknown' });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspServersTool', () => {
    it('returns list of available servers', async () => {
      vi.mocked(lspIndex.getAllServers).mockReturnValue([
        { name: 'TypeScript', command: 'tsserver', extensions: ['.ts', '.tsx'], installed: true, installHint: '' },
        { name: 'Python', command: 'pyright', extensions: ['.py'], installed: false, installHint: 'npm install -g pyright' }
      ]);

      const result = await lspServersTool.handler({});

      expect(result.content[0].text).toContain('## Language Server Status');
      expect(result.content[0].text).toContain('TypeScript');
      expect(result.content[0].text).toContain('Python');
    });
  });

  describe('lspPrepareRenameTool', () => {
    it('returns rename range when valid', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          openDocument: vi.fn(),
          prepareRename: vi.fn().mockResolvedValue({ start: { line: 4, character: 0 }, end: { line: 4, character: 10 } })
        };
        return fn(mockClient as any);
      });

      const result = await lspPrepareRenameTool.handler({ file: 'test.ts', line: 5, character: 5 });

      expect(result.content[0].text).toContain('Rename possible');
      expect(result.content[0].text).toContain('line 5, col 1');
      expect(result.content[0].text).toContain('line 5, col 11');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspPrepareRenameTool.handler({ file: 'test.unknown', line: 1, character: 0 });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspRenameTool', () => {
    it('returns rename edits when valid', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          openDocument: vi.fn(),
          rename: vi.fn().mockResolvedValue({ changes: { 'file:///test.ts': [{ range: { start: { line: 5, character: 0 } }, newText: 'newName' }] } })
        };
        return fn(mockClient as any);
      });
      vi.mocked(lspIndex.countEdits).mockReturnValue({ files: 1, edits: 1 });
      vi.mocked(lspIndex.formatWorkspaceEdit).mockReturnValue('test.ts:6:1 -> newName');

      const result = await lspRenameTool.handler({ file: 'test.ts', line: 5, character: 5, newName: 'newName' });

      expect(result.content[0].text).toContain('Rename to "newName"');
      expect(result.content[0].text).toContain('1 file(s)');
      expect(result.content[0].text).toContain('1 edit(s)');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspRenameTool.handler({ file: 'test.unknown', line: 1, character: 0, newName: 'newName' });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspCodeActionsTool', () => {
    it('returns code actions when found', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          openDocument: vi.fn(),
          codeActions: vi.fn().mockResolvedValue([{ title: 'Fix import' }])
        };
        return fn(mockClient as any);
      });
      vi.mocked(lspIndex.formatCodeActions).mockReturnValue('Code actions: Fix import');

      const result = await lspCodeActionsTool.handler({ file: 'test.ts', startLine: 5, startCharacter: 0, endLine: 5, endCharacter: 10 });

      expect(result.content[0].text).toBe('Code actions: Fix import');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspCodeActionsTool.handler({ file: 'test.unknown', startLine: 1, startCharacter: 0, endLine: 1, endCharacter: 10 });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspCodeActionResolveTool', () => {
    it('returns resolved code action when valid', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue({ command: 'tsserver' } as any);
      vi.mocked(lspIndex.lspClientManager.runWithClientLease).mockImplementation(async (_file, fn) => {
        const mockClient = {
          openDocument: vi.fn(),
          codeActions: vi.fn().mockResolvedValue([{ title: 'Fix import', edit: { changes: {} } }])
        };
        return fn(mockClient as any);
      });

      const result = await lspCodeActionResolveTool.handler({ file: 'test.ts', startLine: 5, startCharacter: 0, endLine: 5, endCharacter: 10, actionIndex: 1 });

      expect(result.content[0].text).toContain('Action: Fix import');
    });

    it('returns error when no server available', async () => {
      vi.mocked(lspIndex.getServerForFile).mockReturnValue(null);

      const result = await lspCodeActionResolveTool.handler({ file: 'test.unknown', startLine: 1, startCharacter: 0, endLine: 1, endCharacter: 10, actionIndex: 1 });

      expect(result.content[0].text).toContain('No language server available');
    });
  });

  describe('lspDiagnosticsDirectoryTool', () => {
    it('returns directory diagnostics when found', async () => {
      vi.mocked(diagnosticsIndex.runDirectoryDiagnostics).mockResolvedValue({
        strategy: 'tsc',
        success: true,
        diagnostics: 'No errors',
        summary: '0 errors, 0 warnings'
      });

      const result = await lspDiagnosticsDirectoryTool.handler({ directory: '/test/dir', strategy: 'auto' });

      expect(result.content[0].text).toContain('No errors');
      expect(result.content[0].text).toContain('0 errors, 0 warnings');
    });

    it('handles diagnostics errors gracefully', async () => {
      vi.mocked(diagnosticsIndex.runDirectoryDiagnostics).mockRejectedValue(new Error('Diagnostics failed'));

      const result = await lspDiagnosticsDirectoryTool.handler({ directory: '/test/dir', strategy: 'auto' });

      expect(result.content[0].text).toContain('Error running directory diagnostics');
      expect(result.content[0].text).toContain('Diagnostics failed');
    });
  });
});

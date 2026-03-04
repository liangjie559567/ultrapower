import { describe, it, expect } from 'vitest';
import {
  uriToPath,
  formatPosition,
  formatRange,
  formatLocation,
  formatHover,
  formatLocations,
  formatDocumentSymbols,
  formatWorkspaceSymbols,
  formatDiagnostics,
  formatCodeActions,
  formatWorkspaceEdit,
  countEdits
} from '../utils.js';
import type { Range, Location, Hover, DocumentSymbol, SymbolInformation, Diagnostic, CodeAction, WorkspaceEdit } from 'vscode-languageserver-protocol';

describe('utils', () => {
  describe('uriToPath', () => {
    it('converts file:// URI to path', () => {
      expect(uriToPath('file:///path/to/file.ts')).toBe('/path/to/file.ts');
    });

    it('decodes URI components', () => {
      expect(uriToPath('file:///path%20with%20spaces/file.ts')).toBe('/path with spaces/file.ts');
    });

    it('returns non-file URI as-is', () => {
      expect(uriToPath('http://example.com')).toBe('http://example.com');
    });
  });

  describe('formatPosition', () => {
    it('formats position with 1-based indexing', () => {
      expect(formatPosition(0, 0)).toBe('1:1');
      expect(formatPosition(9, 4)).toBe('10:5');
    });
  });

  describe('formatRange', () => {
    it('formats single-line range', () => {
      const range: Range = { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } };
      expect(formatRange(range)).toBe('1:1-1:11');
    });

    it('formats multi-line range', () => {
      const range: Range = { start: { line: 0, character: 0 }, end: { line: 5, character: 10 } };
      expect(formatRange(range)).toBe('1:1-6:11');
    });

    it('formats zero-width range', () => {
      const range: Range = { start: { line: 5, character: 10 }, end: { line: 5, character: 10 } };
      expect(formatRange(range)).toBe('6:11');
    });
  });

  describe('formatLocation', () => {
    it('formats location with uri and range', () => {
      const location: Location = {
        uri: 'file:///test.ts',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
      };
      expect(formatLocation(location)).toBe('/test.ts:1:1-1:11');
    });

    it('handles targetUri for LocationLink', () => {
      const location = {
        targetUri: 'file:///test.ts',
        targetRange: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } }
      } as any;
      expect(formatLocation(location)).toBe('/test.ts:6:1-6:11');
    });

    it('returns Unknown location when uri missing', () => {
      const location = {} as Location;
      expect(formatLocation(location)).toBe('Unknown location');
    });

    it('returns path only when range missing', () => {
      const location = { uri: 'file:///test.ts' } as Location;
      expect(formatLocation(location)).toBe('/test.ts');
    });
  });

  describe('formatHover', () => {
    it('returns no hover message for null', () => {
      expect(formatHover(null)).toBe('No hover information available');
    });

    it('formats string contents', () => {
      const hover: Hover = { contents: 'type: string' };
      expect(formatHover(hover)).toBe('type: string');
    });

    it('formats MarkupContent', () => {
      const hover: Hover = { contents: { kind: 'markdown', value: '**bold**' } };
      expect(formatHover(hover)).toBe('**bold**');
    });

    it('formats array contents', () => {
      const hover: Hover = { contents: ['line1', { kind: 'markdown', value: 'line2' }] };
      expect(formatHover(hover)).toBe('line1\n\nline2');
    });

    it('includes range when present', () => {
      const hover: Hover = {
        contents: 'test',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }
      };
      expect(formatHover(hover)).toContain('test');
      expect(formatHover(hover)).toContain('Range: 1:1-1:6');
    });
  });

  describe('formatLocations', () => {
    it('returns no locations message for null', () => {
      expect(formatLocations(null)).toBe('No locations found');
    });

    it('returns no locations message for empty array', () => {
      expect(formatLocations([])).toBe('No locations found');
    });

    it('formats single location', () => {
      const location: Location = {
        uri: 'file:///test.ts',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }
      };
      expect(formatLocations(location)).toBe('/test.ts:1:1-1:6');
    });

    it('formats multiple locations', () => {
      const locations: Location[] = [
        { uri: 'file:///a.ts', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } } },
        { uri: 'file:///b.ts', range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } } }
      ];
      const result = formatLocations(locations);
      expect(result).toContain('/a.ts:1:1-1:6');
      expect(result).toContain('/b.ts:2:1-2:6');
    });
  });

  describe('formatDocumentSymbols', () => {
    it('returns no symbols message for null', () => {
      expect(formatDocumentSymbols(null)).toBe('No symbols found');
    });

    it('returns no symbols message for empty array', () => {
      expect(formatDocumentSymbols([])).toBe('No symbols found');
    });

    it('formats DocumentSymbol', () => {
      const symbols: DocumentSymbol[] = [{
        name: 'testFunction',
        kind: 12,
        range: { start: { line: 0, character: 0 }, end: { line: 5, character: 0 } },
        selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 12 } }
      }];
      const result = formatDocumentSymbols(symbols);
      expect(result).toContain('Function: testFunction');
      expect(result).toContain('[1:1-6:1]');
    });

    it('formats nested DocumentSymbol', () => {
      const symbols: DocumentSymbol[] = [{
        name: 'parent',
        kind: 5,
        range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
        selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 6 } },
        children: [{
          name: 'child',
          kind: 12,
          range: { start: { line: 1, character: 2 }, end: { line: 5, character: 2 } },
          selectionRange: { start: { line: 1, character: 2 }, end: { line: 1, character: 7 } }
        }]
      }];
      const result = formatDocumentSymbols(symbols);
      expect(result).toContain('Class: parent');
      expect(result).toContain('Function: child');
    });

    it('formats SymbolInformation', () => {
      const symbols: SymbolInformation[] = [{
        name: 'testSymbol',
        kind: 12,
        location: {
          uri: 'file:///test.ts',
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
        }
      }];
      const result = formatDocumentSymbols(symbols);
      expect(result).toContain('Function: testSymbol');
      expect(result).toContain('/test.ts:1:1-1:11');
    });

    it('includes container name for SymbolInformation', () => {
      const symbols: SymbolInformation[] = [{
        name: 'method',
        kind: 6,
        containerName: 'MyClass',
        location: {
          uri: 'file:///test.ts',
          range: { start: { line: 5, character: 2 }, end: { line: 5, character: 8 } }
        }
      }];
      const result = formatDocumentSymbols(symbols);
      expect(result).toContain('Method: method (in MyClass)');
    });
  });

  describe('formatWorkspaceSymbols', () => {
    it('returns no symbols message for null', () => {
      expect(formatWorkspaceSymbols(null)).toBe('No symbols found');
    });

    it('returns no symbols message for empty array', () => {
      expect(formatWorkspaceSymbols([])).toBe('No symbols found');
    });

    it('formats workspace symbols', () => {
      const symbols: SymbolInformation[] = [{
        name: 'globalFunc',
        kind: 12,
        location: {
          uri: 'file:///test.ts',
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
        }
      }];
      const result = formatWorkspaceSymbols(symbols);
      expect(result).toContain('Function: globalFunc');
      expect(result).toContain('/test.ts:1:1-1:11');
    });
  });

  describe('formatDiagnostics', () => {
    it('returns no diagnostics message for empty array', () => {
      expect(formatDiagnostics([])).toBe('No diagnostics');
    });

    it('formats diagnostic without file path', () => {
      const diagnostics: Diagnostic[] = [{
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        message: 'Type error',
        severity: 1
      }];
      const result = formatDiagnostics(diagnostics);
      expect(result).toContain('Error: Type error');
      expect(result).toContain('at 1:1-1:6');
    });

    it('formats diagnostic with file path', () => {
      const diagnostics: Diagnostic[] = [{
        range: { start: { line: 5, character: 10 }, end: { line: 5, character: 15 } },
        message: 'Warning message',
        severity: 2
      }];
      const result = formatDiagnostics(diagnostics, 'test.ts');
      expect(result).toContain('Warning: Warning message');
      expect(result).toContain('at test.ts:6:11-6:16');
    });

    it('includes source and code when present', () => {
      const diagnostics: Diagnostic[] = [{
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        message: 'Error',
        severity: 1,
        source: 'typescript',
        code: 'TS2322'
      }];
      const result = formatDiagnostics(diagnostics);
      expect(result).toContain('Error (TS2322)[typescript]');
    });
  });

  describe('formatCodeActions', () => {
    it('returns no actions message for null', () => {
      expect(formatCodeActions(null)).toBe('No code actions available');
    });

    it('returns no actions message for empty array', () => {
      expect(formatCodeActions([])).toBe('No code actions available');
    });

    it('formats code actions', () => {
      const actions: CodeAction[] = [
        { title: 'Fix import' },
        { title: 'Add type annotation', kind: 'quickfix' },
        { title: 'Extract function', kind: 'refactor', isPreferred: true }
      ];
      const result = formatCodeActions(actions);
      expect(result).toContain('1. Fix import');
      expect(result).toContain('2. Add type annotation [quickfix]');
      expect(result).toContain('3. Extract function [refactor] (preferred)');
    });
  });

  describe('formatWorkspaceEdit', () => {
    it('returns no edits message for null', () => {
      expect(formatWorkspaceEdit(null)).toBe('No edits');
    });

    it('formats changes', () => {
      const edit: WorkspaceEdit = {
        changes: {
          'file:///test.ts': [{
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
            newText: 'const'
          }]
        }
      };
      const result = formatWorkspaceEdit(edit);
      expect(result).toContain('File: /test.ts');
      expect(result).toContain('1:1-1:6: "const"');
    });

    it('truncates long text', () => {
      const edit: WorkspaceEdit = {
        changes: {
          'file:///test.ts': [{
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
            newText: 'a'.repeat(100)
          }]
        }
      };
      const result = formatWorkspaceEdit(edit);
      expect(result).toContain('...');
    });

    it('formats documentChanges', () => {
      const edit: WorkspaceEdit = {
        documentChanges: [{
          textDocument: { uri: 'file:///test.ts', version: 1 },
          edits: [{
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
            newText: 'const'
          }]
        }]
      };
      const result = formatWorkspaceEdit(edit);
      expect(result).toContain('File: /test.ts');
      expect(result).toContain('1:1-1:6: "const"');
    });
  });

  describe('countEdits', () => {
    it('returns zero for null', () => {
      expect(countEdits(null)).toEqual({ files: 0, edits: 0 });
    });

    it('counts changes', () => {
      const edit: WorkspaceEdit = {
        changes: {
          'file:///a.ts': [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: 'x' }],
          'file:///b.ts': [
            { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: 'y' },
            { range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } }, newText: 'z' }
          ]
        }
      };
      expect(countEdits(edit)).toEqual({ files: 2, edits: 3 });
    });

    it('counts documentChanges', () => {
      const edit: WorkspaceEdit = {
        documentChanges: [
          {
            textDocument: { uri: 'file:///a.ts', version: 1 },
            edits: [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: 'x' }]
          },
          {
            textDocument: { uri: 'file:///b.ts', version: 1 },
            edits: [
              { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: 'y' },
              { range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } }, newText: 'z' }
            ]
          }
        ]
      };
      expect(countEdits(edit)).toEqual({ files: 2, edits: 3 });
    });

    it('counts both changes and documentChanges', () => {
      const edit: WorkspaceEdit = {
        changes: {
          'file:///a.ts': [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: 'x' }]
        },
        documentChanges: [{
          textDocument: { uri: 'file:///b.ts', version: 1 },
          edits: [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: 'y' }]
        }]
      };
      expect(countEdits(edit)).toEqual({ files: 2, edits: 2 });
    });
  });
});

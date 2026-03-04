import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runLspAggregatedDiagnostics } from '../lsp-aggregator.js';
import * as fs from 'fs';
import { join } from 'path';
import { lspClientManager } from '../../lsp/index.js';

vi.mock('fs');
vi.mock('../../lsp/index.js', () => ({
  lspClientManager: {
    runWithClientLease: vi.fn()
  },
  LSP_DIAGNOSTICS_WAIT_MS: 100
}));

describe('lsp-aggregator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runLspAggregatedDiagnostics', () => {
    it('returns empty success when no files found', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await runLspAggregatedDiagnostics('/test/dir');

      expect(result.success).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
      expect(result.filesChecked).toBe(0);
    });

    it('finds and checks TypeScript files', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['test.ts'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);

      const mockClient = {
        openDocument: vi.fn(),
        getDiagnostics: vi.fn().mockReturnValue([])
      };
      vi.mocked(lspClientManager.runWithClientLease).mockImplementation(async (_file, callback) => {
        await callback(mockClient as any);
      });

      const result = await runLspAggregatedDiagnostics('/test/dir');

      expect(result.filesChecked).toBe(1);
      expect(mockClient.openDocument).toHaveBeenCalledWith(join('/test/dir', 'test.ts'));
    });

    it('aggregates diagnostics from multiple files', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['a.ts', 'b.tsx'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);

      const mockClient = {
        openDocument: vi.fn(),
        getDiagnostics: vi.fn()
          .mockReturnValueOnce([{ severity: 1, message: 'Error in a.ts' }])
          .mockReturnValueOnce([{ severity: 2, message: 'Warning in b.tsx' }])
      };
      vi.mocked(lspClientManager.runWithClientLease).mockImplementation(async (_file, callback) => {
        await callback(mockClient as any);
      });

      const result = await runLspAggregatedDiagnostics('/test/dir');

      expect(result.diagnostics).toHaveLength(2);
      expect(result.errorCount).toBe(1);
      expect(result.warningCount).toBe(1);
      expect(result.success).toBe(false);
    });

    it('skips ignored directories', async () => {
      vi.mocked(fs.readdirSync)
        .mockReturnValueOnce(['node_modules', 'src'] as any)
        .mockReturnValueOnce(['test.ts'] as any);
      vi.mocked(fs.statSync)
        .mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockReturnValueOnce({ isFile: () => false, isDirectory: () => true } as any)
        .mockReturnValueOnce({ isFile: () => true, isDirectory: () => false } as any);

      const mockClient = {
        openDocument: vi.fn(),
        getDiagnostics: vi.fn().mockReturnValue([])
      };
      vi.mocked(lspClientManager.runWithClientLease).mockImplementation(async (_file, callback) => {
        await callback(mockClient as any);
      });

      await runLspAggregatedDiagnostics('/test/dir');

      expect(mockClient.openDocument).toHaveBeenCalledTimes(1);
      expect(mockClient.openDocument).toHaveBeenCalledWith(join('/test/dir', 'src', 'test.ts'));
    });

    it('handles file access errors gracefully', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['test.ts'] as any);
      vi.mocked(fs.statSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await runLspAggregatedDiagnostics('/test/dir');

      expect(result.filesChecked).toBe(0);
      expect(result.diagnostics).toEqual([]);
    });

    it('continues on LSP client errors', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['a.ts', 'b.ts'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);

      vi.mocked(lspClientManager.runWithClientLease)
        .mockRejectedValueOnce(new Error('No server available'))
        .mockImplementation(async (_file, callback) => {
          await callback({
            openDocument: vi.fn(),
            getDiagnostics: vi.fn().mockReturnValue([])
          } as any);
        });

      const result = await runLspAggregatedDiagnostics('/test/dir');

      expect(result.filesChecked).toBe(1);
    });

    it('filters files by extensions', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['test.ts', 'test.py', 'test.js'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);

      const mockClient = {
        openDocument: vi.fn(),
        getDiagnostics: vi.fn().mockReturnValue([])
      };
      vi.mocked(lspClientManager.runWithClientLease).mockImplementation(async (_file, callback) => {
        await callback(mockClient as any);
      });

      await runLspAggregatedDiagnostics('/test/dir', ['.ts']);

      expect(mockClient.openDocument).toHaveBeenCalledTimes(1);
      expect(mockClient.openDocument).toHaveBeenCalledWith(join('/test/dir', 'test.ts'));
    });
  });
});

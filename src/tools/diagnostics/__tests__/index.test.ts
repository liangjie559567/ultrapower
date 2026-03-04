import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runDirectoryDiagnostics } from '../index.js';
import * as fs from 'fs';
import * as tscRunner from '../tsc-runner.js';
import * as lspAggregator from '../lsp-aggregator.js';

vi.mock('fs');
vi.mock('../tsc-runner.js');
vi.mock('../lsp-aggregator.js');

describe('index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runDirectoryDiagnostics', () => {
    it('uses tsc strategy when tsconfig exists and strategy is auto', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(tscRunner.runTscDiagnostics).mockReturnValue({
        success: true,
        diagnostics: [],
        errorCount: 0,
        warningCount: 0
      });

      const result = await runDirectoryDiagnostics('/test/dir', 'auto');

      expect(result.strategy).toBe('tsc');
      expect(result.success).toBe(true);
      expect(tscRunner.runTscDiagnostics).toHaveBeenCalledWith('/test/dir');
    });

    it('uses lsp strategy when tsconfig missing and strategy is auto', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(lspAggregator.runLspAggregatedDiagnostics).mockResolvedValue({
        success: true,
        diagnostics: [],
        errorCount: 0,
        warningCount: 0,
        filesChecked: 0
      });

      const result = await runDirectoryDiagnostics('/test/dir', 'auto');

      expect(result.strategy).toBe('lsp');
      expect(result.success).toBe(true);
      expect(lspAggregator.runLspAggregatedDiagnostics).toHaveBeenCalledWith('/test/dir');
    });

    it('forces tsc strategy when explicitly requested', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(tscRunner.runTscDiagnostics).mockReturnValue({
        success: true,
        diagnostics: [],
        errorCount: 0,
        warningCount: 0
      });

      const result = await runDirectoryDiagnostics('/test/dir', 'tsc');

      expect(result.strategy).toBe('tsc');
      expect(tscRunner.runTscDiagnostics).toHaveBeenCalled();
    });

    it('forces lsp strategy when explicitly requested', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(lspAggregator.runLspAggregatedDiagnostics).mockResolvedValue({
        success: true,
        diagnostics: [],
        errorCount: 0,
        warningCount: 0,
        filesChecked: 5
      });

      const result = await runDirectoryDiagnostics('/test/dir', 'lsp');

      expect(result.strategy).toBe('lsp');
      expect(lspAggregator.runLspAggregatedDiagnostics).toHaveBeenCalled();
    });

    it('formats tsc results with no diagnostics', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(tscRunner.runTscDiagnostics).mockReturnValue({
        success: true,
        diagnostics: [],
        errorCount: 0,
        warningCount: 0
      });

      const result = await runDirectoryDiagnostics('/test/dir', 'tsc');

      expect(result.diagnostics).toContain('No diagnostics found');
      expect(result.summary).toContain('0 errors, 0 warnings');
    });

    it('formats tsc results with diagnostics', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(tscRunner.runTscDiagnostics).mockReturnValue({
        success: false,
        diagnostics: [
          { file: 'test.ts', line: 10, column: 5, code: 'TS2322', message: 'Type error', severity: 'error' }
        ],
        errorCount: 1,
        warningCount: 0
      });

      const result = await runDirectoryDiagnostics('/test/dir', 'tsc');

      expect(result.diagnostics).toContain('test.ts');
      expect(result.diagnostics).toContain('10:5');
      expect(result.summary).toContain('1 errors');
    });

    it('formats lsp results with no diagnostics', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(lspAggregator.runLspAggregatedDiagnostics).mockResolvedValue({
        success: true,
        diagnostics: [],
        errorCount: 0,
        warningCount: 0,
        filesChecked: 3
      });

      const result = await runDirectoryDiagnostics('/test/dir', 'lsp');

      expect(result.diagnostics).toContain('Checked 3 files');
      expect(result.summary).toContain('0 errors, 0 warnings');
    });
  });
});

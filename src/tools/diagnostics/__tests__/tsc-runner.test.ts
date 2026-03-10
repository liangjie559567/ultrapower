import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runTscDiagnostics } from '../tsc-runner.js';
import * as fs from 'fs';
import * as child_process from 'child_process';

vi.mock('fs');
vi.mock('child_process');

describe('tsc-runner', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(child_process.execSync).mockReturnValue(Buffer.from(''));
  });

  describe('runTscDiagnostics', () => {
    it('returns empty success when no tsconfig.json', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = runTscDiagnostics('/test/dir');

      expect(result.success).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    });

    it('returns empty success when tsc succeeds', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(child_process.execSync).mockReturnValue(Buffer.from(''));

      const result = runTscDiagnostics('/test/dir');

      expect(result.success).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    });

    it('parses tsc error output', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const error = new Error() as any;
      error.stdout = Buffer.from('src/file.ts(10,5): error TS2322: Type string is not assignable to type number.');
      vi.mocked(child_process.execSync).mockImplementation(() => { throw error; });

      const result = runTscDiagnostics('/test/dir');

      expect(result.success).toBe(false);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]).toEqual({
        file: 'src/file.ts',
        line: 10,
        column: 5,
        code: 'TS2322',
        message: 'Type string is not assignable to type number.',
        severity: 'error'
      });
      expect(result.errorCount).toBe(1);
      expect(result.warningCount).toBe(0);
    });

    it('parses tsc warning output', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const error = new Error() as any;
      error.stdout = Buffer.from('src/test.ts(5,10): warning TS6133: Variable is declared but never used.');
      vi.mocked(child_process.execSync).mockImplementation(() => { throw error; });

      const result = runTscDiagnostics('/test/dir');

      expect(result.success).toBe(true);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].severity).toBe('warning');
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(1);
    });

    it('parses multiple diagnostics', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const error = new Error() as any;
      error.stdout = Buffer.from(
        'src/a.ts(1,1): error TS2322: Type error.\n' +
        'src/b.ts(2,2): warning TS6133: Unused variable.\n' +
        'src/c.ts(3,3): error TS2304: Cannot find name.'
      );
      vi.mocked(child_process.execSync).mockImplementation(() => { throw error; });

      const result = runTscDiagnostics('/test/dir');

      expect(result.diagnostics).toHaveLength(3);
      expect(result.errorCount).toBe(2);
      expect(result.warningCount).toBe(1);
    });

    it('handles empty error output', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const error = new Error() as any;
      error.stdout = Buffer.from('');
      vi.mocked(child_process.execSync).mockImplementation(() => { throw error; });

      const result = runTscDiagnostics('/test/dir');

      expect(result.success).toBe(true);
      expect(result.diagnostics).toEqual([]);
    });
  });
});

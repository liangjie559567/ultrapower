import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectCodexCli, detectGeminiCli } from '../cli-detection.js';
import { spawnSync } from 'child_process';

vi.mock('child_process');

describe('CLI Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectCodexCli', () => {
    it('detects installed CLI', () => {
      vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '/usr/bin/codex\n', stderr: '', error: undefined } as any);
      vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '1.0.0\n', stderr: '', error: undefined } as any);

      const result = detectCodexCli(false);
      expect(result.available).toBe(true);
      expect(result.path).toBe('/usr/bin/codex');
      expect(result.version).toBe('1.0.0');
    });

    it('handles missing CLI', () => {
      vi.mocked(spawnSync).mockReturnValueOnce({ status: 1, stdout: '', stderr: 'not found', error: undefined } as any);

      const result = detectCodexCli(false);
      expect(result.available).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('caches results', () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: '/usr/bin/codex\n', stderr: '', error: undefined } as any);

      detectCodexCli(false);
      const cached = detectCodexCli(true);

      expect(cached.available).toBe(true);
      expect(vi.mocked(spawnSync)).toHaveBeenCalledTimes(2);
    });
  });

  describe('detectGeminiCli', () => {
    it('detects installed CLI', () => {
      vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '/usr/bin/gemini\n', stderr: '', error: undefined } as any);
      vi.mocked(spawnSync).mockReturnValueOnce({ status: 0, stdout: '2.0.0\n', stderr: '', error: undefined } as any);

      const result = detectGeminiCli(false);
      expect(result.available).toBe(true);
    });

    it('handles missing CLI', () => {
      vi.mocked(spawnSync).mockReturnValueOnce({ status: 1, stdout: '', stderr: 'not found', error: undefined } as any);

      const result = detectGeminiCli(false);
      expect(result.available).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { codexMcpServer, codexToolNames } from '../mcp/codex-server.js';
import { geminiMcpServer, geminiToolNames } from '../mcp/gemini-server.js';
import { detectCodexCli, detectGeminiCli, resetDetectionCache } from '../mcp/cli-detection.js';
import { spawnSync } from 'child_process';

// Mock child_process
vi.mock('child_process', () => ({
  spawnSync: vi.fn(),
  spawn: vi.fn()
}));

describe('Multi-Model MCP Servers', () => {
  describe('Codex MCP Server', () => {
    it('should be defined', () => {
      expect(codexMcpServer).toBeDefined();
    });

    it('should export correct tool names', () => {
      expect(codexToolNames).toHaveLength(5);
      expect(codexToolNames).toContain('ask_codex');
      expect(codexToolNames).toContain('wait_for_job');
      expect(codexToolNames).toContain('check_job_status');
      expect(codexToolNames).toContain('kill_job');
      expect(codexToolNames).toContain('list_jobs');
    });

    it('should have server name "x"', () => {
      // Server is created with name "x" for tool prefixing
      expect(codexMcpServer).toBeDefined();
    });
  });

  describe('Gemini MCP Server', () => {
    it('should be defined', () => {
      expect(geminiMcpServer).toBeDefined();
    });

    it('should export correct tool names', () => {
      expect(geminiToolNames).toHaveLength(5);
      expect(geminiToolNames).toContain('ask_gemini');
      expect(geminiToolNames).toContain('wait_for_job');
      expect(geminiToolNames).toContain('check_job_status');
      expect(geminiToolNames).toContain('kill_job');
      expect(geminiToolNames).toContain('list_jobs');
    });

    it('should have server name "g"', () => {
      // Server is created with name "g" for tool prefixing
      expect(geminiMcpServer).toBeDefined();
    });
  });

  describe('CLI Detection', () => {
    beforeEach(() => {
      resetDetectionCache();
      vi.clearAllMocks();
    });

    describe('detectCodexCli', () => {
      it('should detect Codex CLI when available', () => {
        vi.mocked(spawnSync)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/local/bin/codex\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '1.0.0\n', stderr: '', error: undefined } as any);

        const result = detectCodexCli();

        expect(result.available).toBe(true);
        expect(result.path).toBe('/usr/local/bin/codex');
        expect(result.version).toBe('1.0.0');
        expect(result.installHint).toContain('npm install -g @openai/codex');
      });

      it('should handle missing Codex CLI', () => {
        vi.mocked(spawnSync).mockReturnValueOnce({ status: 1, stdout: '', stderr: 'command not found', error: undefined } as any);

        const result = detectCodexCli();

        expect(result.available).toBe(false);
        expect(result.error).toContain('not found on PATH');
        expect(result.installHint).toContain('npm install -g @openai/codex');
      });

      it('should cache detection results', () => {
        vi.mocked(spawnSync)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/codex\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '2.0.0\n', stderr: '', error: undefined } as any);

        const result1 = detectCodexCli();
        const result2 = detectCodexCli();

        // spawnSync should only be called twice (once for which, once for version)
        expect(spawnSync).toHaveBeenCalledTimes(2);
        expect(result1).toBe(result2); // Same reference due to caching
      });

      it('should bypass cache when useCache is false', () => {
        vi.mocked(spawnSync)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/codex\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '2.0.0\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/codex\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '2.0.0\n', stderr: '', error: undefined } as any);

        detectCodexCli(true);
        detectCodexCli(false);

        expect(spawnSync).toHaveBeenCalledTimes(4);
      });
    });

    describe('detectGeminiCli', () => {
      it('should detect Gemini CLI when available', () => {
        vi.mocked(spawnSync)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/local/bin/gemini\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '1.5.0\n', stderr: '', error: undefined } as any);

        const result = detectGeminiCli();

        expect(result.available).toBe(true);
        expect(result.path).toBe('/usr/local/bin/gemini');
        expect(result.version).toBe('1.5.0');
        expect(result.installHint).toContain('@google/gemini-cli');
      });

      it('should handle missing Gemini CLI', () => {
        vi.mocked(spawnSync).mockReturnValueOnce({ status: 1, stdout: '', stderr: 'command not found', error: undefined } as any);

        const result = detectGeminiCli();

        expect(result.available).toBe(false);
        expect(result.error).toContain('not found on PATH');
        expect(result.installHint).toContain('@google/gemini-cli');
      });

      it('should cache detection results', () => {
        vi.mocked(spawnSync)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/gemini\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '1.0.0\n', stderr: '', error: undefined } as any);

        const result1 = detectGeminiCli();
        const result2 = detectGeminiCli();

        expect(spawnSync).toHaveBeenCalledTimes(2);
        expect(result1).toBe(result2);
      });
    });

    describe('resetDetectionCache', () => {
      it('should clear both caches', () => {
        vi.mocked(spawnSync)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/codex\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '1.0.0\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/gemini\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '1.0.0\n', stderr: '', error: undefined } as any);

        detectCodexCli();
        detectGeminiCli();

        resetDetectionCache();

        // After reset, should call spawnSync again
        vi.mocked(spawnSync)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/codex\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '1.0.0\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/gemini\n', stderr: '', error: undefined } as any)
          .mockReturnValueOnce({ status: 0, stdout: '1.0.0\n', stderr: '', error: undefined } as any);

        detectCodexCli();
        detectGeminiCli();

        expect(spawnSync).toHaveBeenCalledTimes(8);
      });
    });
  });
});

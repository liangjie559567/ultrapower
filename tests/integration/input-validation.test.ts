import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

describe('BUG-006 空输入处理集成测试', () => {
  const bridgePath = join(process.cwd(), 'dist/hooks/bridge.js');

  const runBridge = (hookType: string, input: string): Promise<{ exitCode: number; stderr: string }> => {
    return new Promise((resolve, reject) => {
      const proc = spawn('node', [bridgePath, `--hook=${hookType}`], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        resolve({ exitCode: code ?? 0, stderr });
      });

      proc.on('error', reject);

      proc.stdin.write(input);
      proc.stdin.end();
    });
  };

  describe('端到端空输入验证', () => {
    it('should reject empty input across all hook types', async () => {
      const hookTypes = ['user-prompt-submit', 'stop', 'session-start'];

      for (const hookType of hookTypes) {
        const result = await runBridge(hookType, '');
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Hook input is empty');
      }
    });

    it('should reject invalid JSON across all hook types', async () => {
      const hookTypes = ['user-prompt-submit', 'stop'];

      for (const hookType of hookTypes) {
        const result = await runBridge(hookType, '{invalid}');
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid JSON input');
      }
    });
  });

  describe('用户友好错误信息', () => {
    it('should provide clear error for empty input', async () => {
      const result = await runBridge('user-prompt-submit', '');
      expect(result.stderr).toContain('[hook-bridge]');
      expect(result.stderr).toContain('empty');
      expect(result.stderr).not.toContain('undefined');
      expect(result.stderr).not.toContain('null');
    });

    it('should provide clear error for invalid JSON', async () => {
      const result = await runBridge('user-prompt-submit', 'not json');
      expect(result.stderr).toContain('[hook-bridge]');
      expect(result.stderr).toContain('Invalid JSON');
      expect(result.stderr).toMatch(/Unexpected token|Unexpected end/);
    });
  });
});

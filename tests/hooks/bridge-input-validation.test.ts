import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

describe('BUG-006 Hook 输入验证', () => {
  const bridgePath = join(process.cwd(), 'dist/hooks/bridge.js');

  const runBridge = (input: string | null): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return new Promise((resolve, reject) => {
      const proc = spawn('node', [bridgePath, '--hook=user-prompt-submit'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      });

      proc.on('error', (err) => {
        reject(err);
      });

      if (input !== null) {
        proc.stdin.write(input);
      }
      proc.stdin.end();
    });
  };

  describe('空输入处理', () => {
    it('should reject empty string input', async () => {
      const result = await runBridge('');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Hook input is empty');
    });

    it('should reject whitespace-only input', async () => {
      const result = await runBridge('   \n\t  ');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Hook input is empty');
    });

    it('should reject null input', async () => {
      const result = await runBridge(null);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Hook input is empty');
    });
  });

  describe('无效 JSON 处理', () => {
    it('should reject malformed JSON', async () => {
      const result = await runBridge('{invalid json}');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid JSON input');
    });

    it('should reject incomplete JSON', async () => {
      const result = await runBridge('{"key": "value"');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid JSON input');
    });

    it('should reject non-JSON text', async () => {
      const result = await runBridge('this is not json');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid JSON input');
    });
  });

  describe('有效输入处理', () => {
    it('should accept valid minimal JSON', async () => {
      const result = await runBridge('{}');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('"continue":true');
    });

    it('should accept valid JSON with fields', async () => {
      const input = JSON.stringify({
        directory: '/test',
        sessionId: 'test-123',
      });
      const result = await runBridge(input);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('"continue":true');
    });
  });

  describe('超长字段处理', () => {
    it('should handle large but valid JSON', async () => {
      const largeField = 'x'.repeat(10000);
      const input = JSON.stringify({ field: largeField });
      const result = await runBridge(input);
      expect(result.exitCode).toBe(0);
    });

    it('should handle deeply nested JSON', async () => {
      let nested: any = { value: 'end' };
      for (let i = 0; i < 100; i++) {
        nested = { nested };
      }
      const input = JSON.stringify(nested);
      const result = await runBridge(input);
      expect(result.exitCode).toBe(0);
    });
  });
});

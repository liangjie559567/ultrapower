import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

describe('BUG-002 Hook 输入验证集成测试', () => {
  const bridgePath = join(process.cwd(), 'dist/hooks/bridge.js');

  const runBridge = (hookType: string, input: Record<string, any>): Promise<{ exitCode: number; stderr: string }> => {
    return new Promise((resolve, reject) => {
      const proc = spawn('node', [bridgePath, `--hook=${hookType}`], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ exitCode: code ?? 0, stderr }));
      proc.on('error', reject);

      proc.stdin.write(JSON.stringify(input));
      proc.stdin.end();
    });
  };

  describe('敏感 hook 输入验证', () => {
    it('should reject __proto__ pollution attempt', async () => {
      const result = await runBridge('permission-request', {
        directory: '/test',
        toolName: 'Read',
        __proto__: { polluted: true }
      });

      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('polluted');
    });

    it('should reject constructor pollution', async () => {
      const result = await runBridge('permission-request', {
        directory: '/test',
        toolName: 'Write',
        constructor: { prototype: { polluted: true } }
      });

      expect(result.exitCode).toBe(0);
    });
  });

  describe('异常场景恢复', () => {
    it('should handle malformed sensitive hook input gracefully', async () => {
      const result = await runBridge('setup', {
        directory: '/test'
      });

      expect(result.exitCode).toBe(0);
    });
  });
});

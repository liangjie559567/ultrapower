import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

describe('BUG-002 Hook 输入验证集成测试', () => {
  const bridgePath = join(process.cwd(), 'dist/hooks/bridge.js');

  const runBridge = (hookType: string, input: Record<string, any> | string): Promise<{ exitCode: number; stderr: string }> => {
    return new Promise((resolve, reject) => {
      const proc = spawn('node', [bridgePath, `--hook=${hookType}`], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ exitCode: code ?? 0, stderr }));
      proc.on('error', reject);

      const jsonInput = typeof input === 'string' ? input : JSON.stringify(input);
      proc.stdin.write(jsonInput);
      proc.stdin.end();
    });
  };

  describe('敏感 hook 输入验证', () => {
    it('should block __proto__ pollution attempt', async () => {
      // Use JSON string with __proto__ to bypass JSON.stringify filtering
      const maliciousJson = '{"sessionId":"test-session","directory":"/test","toolName":"Read","__proto__":{"polluted":true}}';
      const result = await runBridge('permission-request', maliciousJson);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Prototype pollution attempt blocked');
    });

    it('should block constructor pollution', async () => {
      const result = await runBridge('permission-request', {
        sessionId: 'test-session',
        directory: '/test',
        toolName: 'Write',
        constructor: { prototype: { polluted: true } }
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Prototype pollution attempt blocked');
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

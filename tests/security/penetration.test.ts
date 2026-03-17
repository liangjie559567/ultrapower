import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

describe('T17 渗透测试', () => {
  const bridgePath = join(process.cwd(), 'dist/hooks/bridge.js');

  const runBridge = (hookType: string, input: Record<string, any> | string): Promise<{ exitCode: number; stderr: string }> => {
    return new Promise((resolve) => {
      const proc = spawn('node', [bridgePath, `--hook=${hookType}`], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ exitCode: code ?? 0, stderr }));
      proc.on('error', () => resolve({ exitCode: 1, stderr: 'spawn error' }));

      const jsonInput = typeof input === 'string' ? input : JSON.stringify(input);
      proc.stdin.write(jsonInput);
      proc.stdin.end();
    });
  };

  describe('已知攻击向量验证', () => {
    it('should block __proto__ pollution in permission-request', async () => {
      const maliciousJson = '{"sessionId":"test-session","directory":"/test","toolName":"Read","__proto__":{"isAdmin":true}}';
      const result = await runBridge('permission-request', maliciousJson);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Prototype pollution attempt blocked');
    });

    it('should block constructor pollution in setup', async () => {
      const maliciousJson = '{"sessionId":"test-session","directory":"/test","constructor":{"prototype":{"polluted":true}}}';
      const result = await runBridge('setup-init', maliciousJson);
      expect(result.exitCode).toBe(1);
    });

    it('should block deep nested __proto__ pollution', async () => {
      const maliciousJson = '{"sessionId":"test-session","directory":"/test","toolName":"Read","nested":{"deep":{"__proto__":{"polluted":true}}}}';
      const result = await runBridge('permission-request', maliciousJson);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Prototype pollution attempt blocked');
    });
  });
});

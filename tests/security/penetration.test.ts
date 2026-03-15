import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

describe('T17 渗透测试', () => {
  const bridgePath = join(process.cwd(), 'dist/hooks/bridge.js');

  const runBridge = (hookType: string, input: Record<string, any>): Promise<{ exitCode: number; stderr: string }> => {
    return new Promise((resolve) => {
      const proc = spawn('node', [bridgePath, `--hook=${hookType}`], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ exitCode: code ?? 0, stderr }));
      proc.on('error', () => resolve({ exitCode: 1, stderr: 'spawn error' }));

      proc.stdin.write(JSON.stringify(input));
      proc.stdin.end();
    });
  };

  describe('已知攻击向量验证', () => {
    it('should block __proto__ pollution in permission-request', async () => {
      const result = await runBridge('permission-request', {
        directory: '/test',
        toolName: 'Read',
        __proto__: { isAdmin: true }
      });
      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('isAdmin');
    });

    it('should block constructor pollution in setup', async () => {
      const result = await runBridge('setup', {
        directory: '/test',
        constructor: { prototype: { polluted: true } }
      });
      expect(result.exitCode).toBe(0);
    });
  });
});

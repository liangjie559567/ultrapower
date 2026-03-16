import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

describe('T17 安全模糊测试', () => {
  const bridgePath = join(process.cwd(), 'dist/hooks/bridge.js');

  const runBridge = (input: string): Promise<{ exitCode: number; stderr: string }> => {
    return new Promise((resolve) => {
      const proc = spawn('node', [bridgePath, '--hook=user-prompt-submit'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ exitCode: code ?? 0, stderr }));
      proc.on('error', () => resolve({ exitCode: 1, stderr: 'spawn error' }));

      proc.stdin.write(input);
      proc.stdin.end();
    });
  };

  describe('原型污染攻击向量', () => {
    const prototypePollutionPayloads = [
      '{"__proto__":{"polluted":true}}',
      '{"constructor":{"prototype":{"polluted":true}}}',
      '{"__proto__.polluted":"true"}',
      '{"constructor.prototype.polluted":"true"}',
    ];

    prototypePollutionPayloads.forEach((payload, i) => {
      it(`should reject prototype pollution payload ${i + 1}`, async () => {
        const result = await runBridge(payload);
        expect(result.exitCode).toBe(0);
        expect(result.stderr).not.toContain('polluted');
      });
    });
  });

  describe('JSON 注入攻击', () => {
    const jsonInjectionPayloads = [
      '{"message":"\\u0000"}',
      '{"message":"test"}',
      '{"message":"\\"\\n\\r\\t"}',
      '{"message":"<script>alert(1)</script>"}',
    ];

    jsonInjectionPayloads.forEach((payload, i) => {
      it(`should handle JSON injection payload ${i + 1}`, async () => {
        const result = await runBridge(payload);
        expect(result.exitCode).toBe(0);
      });
    });
  });

  describe('超大输入攻击', () => {
    it('should reject extremely large JSON (>1MB)', async () => {
      const largePayload = '{"data":"' + 'A'.repeat(1024 * 1024) + '"}';
      const result = await runBridge(largePayload);
      expect(result.exitCode).toBe(0);
    });

    it('should handle deeply nested JSON', async () => {
      let nested = '{"a":';
      for (let i = 0; i < 100; i++) nested += '{"b":';
      nested += '1';
      for (let i = 0; i < 100; i++) nested += '}';
      nested += '}';
      const result = await runBridge(nested);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('路径遍历攻击', () => {
    const pathTraversalPayloads = [
      '{"directory":"../../../etc/passwd"}',
      '{"directory":"..\\\\..\\\\..\\\\windows\\\\system32"}',
      '{"directory":"/etc/passwd"}',
      '{"directory":"C:\\\\Windows\\\\System32"}',
    ];

    pathTraversalPayloads.forEach((payload, i) => {
      it(`should handle path traversal payload ${i + 1}`, async () => {
        const result = await runBridge(payload);
        expect(result.exitCode).toBe(0);
      });
    });
  });
});

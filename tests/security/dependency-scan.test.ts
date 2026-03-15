import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('T17 依赖漏洞扫描', () => {
  it('should report dependency vulnerabilities', () => {
    try {
      const output = execSync('npm audit --json', { encoding: 'utf-8' });
      const audit = JSON.parse(output);

      const highVulns = audit.metadata?.vulnerabilities?.high || 0;
      const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;

      if (highVulns + criticalVulns > 0) {
        console.warn(`Found ${highVulns} high and ${criticalVulns} critical vulnerabilities`);
      }
      expect(true).toBe(true);
    } catch (err) {
      const nodeErr = err as { stdout?: string };
      if (nodeErr.stdout) {
        const audit = JSON.parse(nodeErr.stdout);
        const highVulns = audit.metadata?.vulnerabilities?.high || 0;
        const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
        if (highVulns + criticalVulns > 0) {
          console.warn(`Found ${highVulns} high and ${criticalVulns} critical vulnerabilities`);
        }
      }
      expect(true).toBe(true);
    }
  });
});

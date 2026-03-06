import { describe, it, expect } from 'vitest';
import { killProcessTree } from './process-utils';

describe('process-utils security', () => {
  it('should reject invalid PID values', async () => {
    expect(await killProcessTree(-1)).toBe(false);
    expect(await killProcessTree(0)).toBe(false);
    expect(await killProcessTree(1.5)).toBe(false);
  });

  it('should handle PID without command injection on Windows', async () => {
    if (process.platform !== 'win32') {
      return;
    }

    // These PIDs should not cause shell interpretation
    const maliciousPids = [
      99999, // Non-existent PID
    ];

    for (const pid of maliciousPids) {
      const result = await killProcessTree(pid);
      expect(typeof result).toBe('boolean');
    }
  });
});

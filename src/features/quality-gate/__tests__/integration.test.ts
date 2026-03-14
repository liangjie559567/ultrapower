import { describe, it, expect } from 'vitest';
import { runQualityGate } from '../gate-checker.js';

describe('Quality Gate Integration', () => {
  it('should pass gate with clean files', async () => {
    const result = await runQualityGate([], process.cwd());
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it('should skip when requested', async () => {
    const result = await runQualityGate([], process.cwd(), true);
    expect(result.passed).toBe(true);
  });
});

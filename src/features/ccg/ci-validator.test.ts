import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runCIValidation } from './ci-validator';
import { exec } from 'child_process';
import { promisify } from 'util';

vi.mock('child_process');

const execAsync = promisify(exec);

describe('CI Validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass when all checks succeed', async () => {
    vi.mocked(execAsync).mockResolvedValue({ stdout: '', stderr: '' } as any);

    const result = await runCIValidation();

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when tsc fails', async () => {
    vi.mocked(execAsync).mockRejectedValueOnce(new Error('tsc error'));

    const result = await runCIValidation();

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should fail when build fails', async () => {
    vi.mocked(execAsync)
      .mockResolvedValueOnce({ stdout: '', stderr: '' } as any)
      .mockRejectedValueOnce(new Error('build error'));

    const result = await runCIValidation();

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Build failed: build error');
  });
});

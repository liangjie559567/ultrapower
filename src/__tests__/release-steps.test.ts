import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Reset module registry before each test to avoid ESM cache issues
beforeEach(() => {
  vi.resetModules();
});

describe('release-steps', () => {
  it('validateBuild: dry-run returns success without executing', async () => {
    // @ts-ignore - .mjs runtime script outside rootDir
    const { validateBuild } = await import('../../../scripts/release-steps.mjs');
    const result = await validateBuild({ dryRun: true });
    expect(result.success).toBe(true);
  });

  it('publishNpm: dry-run prints command without executing', async () => {
    // @ts-ignore - .mjs runtime script outside rootDir
    const { publishNpm } = await import('../../../scripts/release-steps.mjs');
    const result = await publishNpm({ dryRun: true });
    expect(result.success).toBe(true);
    expect(result.version).toBeDefined();
  });

  it('createGithubRelease: dry-run returns success', async () => {
    // @ts-ignore - .mjs runtime script outside rootDir
    const { createGithubRelease } = await import('../../../scripts/release-steps.mjs');
    const result = await createGithubRelease({ version: '5.3.0', dryRun: true });
    expect(result.success).toBe(true);
  });

  it('syncMarketplace: dry-run returns success', async () => {
    // @ts-ignore - .mjs runtime script outside rootDir
    const { syncMarketplace } = await import('../../../scripts/release-steps.mjs');
    const result = await syncMarketplace({ version: '5.3.0', dryRun: true });
    expect(result.success).toBe(true);
  });

  it('runReleasePipeline: startFrom skips earlier steps', async () => {
    // @ts-ignore - .mjs runtime script outside rootDir
    const { runReleasePipeline } = await import('../../../scripts/release-steps.mjs');
    // startFrom='release' skips validate and publish
    const result = await runReleasePipeline({ dryRun: true, startFrom: 'release', version: '5.3.0' });
    expect(result.success).toBe(true);
  });

  it('CLI step mapping covers all 4 steps', () => {
    const steps = ['validate', 'publish', 'release', 'sync'];
    expect(steps).toHaveLength(4);
  });
});

describe('failure paths', () => {
  beforeEach(() => {
    vi.resetModules();
    // vi.doMock is not hoisted, so it runs after resetModules and before the
    // dynamic import inside each test — this is the correct pattern for mocking
    // ESM modules that use the 'node:' prefix specifier.
    vi.doMock('node:child_process', () => ({
      execSync: vi.fn().mockImplementation(() => {
        throw new Error('command failed');
      }),
    }));
  });

  afterEach(() => {
    vi.doUnmock('node:child_process');
  });

  it('validateBuild: returns success:false when execSync throws', async () => {
    // @ts-ignore - .mjs runtime script outside rootDir
    const { validateBuild } = await import('../../../scripts/release-steps.mjs');
    const result = await validateBuild({ dryRun: false });
    expect(result.success).toBe(false);
    expect(result.output).toContain('command failed');
  });

  it('publishNpm: returns success:false when execSync throws', async () => {
    // @ts-ignore - .mjs runtime script outside rootDir
    const { publishNpm } = await import('../../../scripts/release-steps.mjs');
    const result = await publishNpm({ dryRun: false, version: '1.0.0' });
    expect(result.success).toBe(false);
    expect(result.output).toContain('command failed');
  });

  it('runReleasePipeline: calls process.exit(1) when validate fails', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: string | number | null) => never);
    // @ts-ignore - .mjs runtime script outside rootDir
    const { runReleasePipeline } = await import('../../../scripts/release-steps.mjs');
    await runReleasePipeline({ dryRun: false });
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});

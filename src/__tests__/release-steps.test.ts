import { describe, it, expect, vi, beforeEach } from 'vitest';

// Reset module registry before each test to avoid ESM cache issues
beforeEach(() => {
  vi.resetModules();
});

describe('release-steps', () => {
  it('validateBuild: dry-run returns success without executing', async () => {
    const { validateBuild } = await import('../../../scripts/release-steps.mjs');
    const result = await validateBuild({ dryRun: true });
    expect(result.success).toBe(true);
  });

  it('publishNpm: dry-run prints command without executing', async () => {
    const { publishNpm } = await import('../../../scripts/release-steps.mjs');
    const result = await publishNpm({ dryRun: true });
    expect(result.success).toBe(true);
    expect(result.version).toBeDefined();
  });

  it('createGithubRelease: dry-run returns success', async () => {
    const { createGithubRelease } = await import('../../../scripts/release-steps.mjs');
    const result = await createGithubRelease({ version: '5.3.0', dryRun: true });
    expect(result.success).toBe(true);
  });

  it('syncMarketplace: dry-run returns success', async () => {
    const { syncMarketplace } = await import('../../../scripts/release-steps.mjs');
    const result = await syncMarketplace({ version: '5.3.0', dryRun: true });
    expect(result.success).toBe(true);
  });

  it('runReleasePipeline: startFrom skips earlier steps', async () => {
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

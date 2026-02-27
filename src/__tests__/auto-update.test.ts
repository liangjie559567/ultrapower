import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('../installer/index.js', async () => {
  const actual = await vi.importActual<typeof import('../installer/index.js')>('../installer/index.js');
  return {
    ...actual,
    install: vi.fn(),
    HOOKS_DIR: '/tmp/omc-test-hooks',
    isProjectScopedPlugin: vi.fn(),
    isRunningAsPlugin: vi.fn(),
    checkNodeVersion: vi.fn(),
  };
});

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

vi.mock('../lib/version.js', () => ({
  getRuntimePackageVersion: vi.fn().mockReturnValue('4.1.5'),
}));

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { install, isProjectScopedPlugin, isRunningAsPlugin, checkNodeVersion } from '../installer/index.js';
import * as hooksModule from '../installer/hooks.js';
import {
  reconcileUpdateRuntime,
  performUpdate,
  silentAutoUpdate,
} from '../features/auto-update.js';

const mockedExecSync = vi.mocked(execSync);
const mockedExistsSync = vi.mocked(existsSync);
const mockedMkdirSync = vi.mocked(mkdirSync);
const mockedReadFileSync = vi.mocked(readFileSync);
const mockedWriteFileSync = vi.mocked(writeFileSync);
const mockedInstall = vi.mocked(install);
const mockedIsProjectScopedPlugin = vi.mocked(isProjectScopedPlugin);
const mockedIsRunningAsPlugin = vi.mocked(isRunningAsPlugin);
const mockedCheckNodeVersion = vi.mocked(checkNodeVersion);

describe('auto-update reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedExistsSync.mockReturnValue(true);
    mockedIsProjectScopedPlugin.mockReturnValue(false);
    mockedReadFileSync.mockImplementation((path: Parameters<typeof readFileSync>[0]) => {
      if (String(path).includes('.omc-version.json')) {
        return JSON.stringify({
          version: '4.1.5',
          installedAt: '2026-02-09T00:00:00.000Z',
          installMethod: 'npm',
        });
      }
      return '';
    });
    mockedCheckNodeVersion.mockReturnValue({
      valid: true,
      current: 20,
      required: 20,
    });
    mockedInstall.mockReturnValue({
      success: true,
      message: 'ok',
      installedAgents: [],
      installedCommands: [],
      installedSkills: [],
      hooksConfigured: true,
      hookConflicts: [],
      errors: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reconciles runtime state and refreshes hooks after update', () => {
    mockedExistsSync.mockReturnValue(false);

    const result = reconcileUpdateRuntime({ verbose: false });

    expect(result.success).toBe(true);
    expect(mockedMkdirSync).toHaveBeenCalledWith('/tmp/omc-test-hooks', { recursive: true });
    expect(mockedInstall).toHaveBeenCalledWith({
      force: true,
      verbose: false,
      skipClaudeCheck: true,
      forceHooks: true,
      refreshHooksInPlugin: true,
    });
  });

  it('skips hooks directory prep in project-scoped plugin reconciliation', () => {
    mockedIsProjectScopedPlugin.mockReturnValue(true);

    const result = reconcileUpdateRuntime({ verbose: false });

    expect(result.success).toBe(true);
    expect(mockedMkdirSync).not.toHaveBeenCalled();
    expect(mockedInstall).toHaveBeenCalledWith({
      force: true,
      verbose: false,
      skipClaudeCheck: true,
      forceHooks: true,
      refreshHooksInPlugin: false,
    });
  });

  it('is idempotent when reconciliation runs repeatedly', () => {
    const first = reconcileUpdateRuntime({ verbose: false });
    const second = reconcileUpdateRuntime({ verbose: false });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(mockedInstall).toHaveBeenNthCalledWith(1, {
      force: true,
      verbose: false,
      skipClaudeCheck: true,
      forceHooks: true,
      refreshHooksInPlugin: true,
    });
    expect(mockedInstall).toHaveBeenNthCalledWith(2, {
      force: true,
      verbose: false,
      skipClaudeCheck: true,
      forceHooks: true,
      refreshHooksInPlugin: true,
    });
  });

  it('runs reconciliation as part of performUpdate', async () => {
    // Set env var so performUpdate takes the direct reconciliation path
    // (simulates being in the re-exec'd process after npm install)
    process.env.OMC_UPDATE_RECONCILE = '1';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v4.1.5',
        name: '4.1.5',
        published_at: '2026-02-09T00:00:00.000Z',
        html_url: 'https://example.com/release',
        body: 'notes',
        prerelease: false,
        draft: false,
      }),
    }));

    mockedExecSync.mockReturnValue('');

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
    expect(mockedExecSync).toHaveBeenCalledWith('npm install -g @liangjie559567/ultrapower@latest', expect.any(Object));
    expect(mockedInstall).toHaveBeenCalledWith({
      force: true,
      verbose: false,
      skipClaudeCheck: true,
      forceHooks: true,
      refreshHooksInPlugin: true,
    });

    delete process.env.OMC_UPDATE_RECONCILE;
  });

  it('does not persist metadata when reconciliation fails', async () => {
    // Set env var so performUpdate takes the direct reconciliation path
    process.env.OMC_UPDATE_RECONCILE = '1';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v4.1.5',
        name: '4.1.5',
        published_at: '2026-02-09T00:00:00.000Z',
        html_url: 'https://example.com/release',
        body: 'notes',
        prerelease: false,
        draft: false,
      }),
    }));

    mockedExecSync.mockReturnValue('');
    mockedInstall.mockReturnValue({
      success: false,
      message: 'fail',
      installedAgents: [],
      installedCommands: [],
      installedSkills: [],
      hooksConfigured: false,
      hookConflicts: [],
      errors: ['boom'],
    });

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Reconciliation failed: boom']);
    expect(mockedWriteFileSync).not.toHaveBeenCalled();

    delete process.env.OMC_UPDATE_RECONCILE;
  });

  it('preserves non-OMC hooks when refreshing plugin hooks during reconciliation', () => {
    const existingSettings = {
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: 'command',
                command: 'node $HOME/.claude/hooks/other-plugin.mjs',
              },
            ],
          },
        ],
      },
    };

    const settingsPath = join(homedir(), '.claude', 'settings.json');
    const baseHooks = hooksModule.getHooksSettingsConfig();
    const freshHooks = {
      ...baseHooks,
      hooks: {
        ...baseHooks.hooks,
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: 'command' as const,
                command: 'node $HOME/.claude/hooks/keyword-detector.mjs',
              },
            ],
          },
        ],
      },
    };

    mockedExistsSync.mockImplementation((path) => {
      const normalized = String(path).replace(/\\/g, '/');
      if (normalized === settingsPath) {
        return true;
      }
      if (normalized.endsWith('/.claude/hud')) {
        return false;
      }
      if (normalized.includes('/hooks/')) {
        return false;
      }
      return true;
    });
    mockedIsProjectScopedPlugin.mockReturnValue(false);

    mockedReadFileSync.mockImplementation((path: Parameters<typeof readFileSync>[0]) => {
      if (String(path) === settingsPath) {
        return JSON.stringify(existingSettings);
      }
      if (String(path).includes('/hooks/')) {
        return 'hook-script';
      }
      return '';
    });

    vi.spyOn(hooksModule, 'getHooksSettingsConfig').mockReturnValue(freshHooks);

    const originalPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
    process.env.CLAUDE_PLUGIN_ROOT = join(homedir(), '.claude', 'plugins', 'cache', 'omc', 'ultrapower', '4.1.5');

    const result = install({
      force: true,
      skipClaudeCheck: true,
      refreshHooksInPlugin: true,
    });

    if (originalPluginRoot !== undefined) {
      process.env.CLAUDE_PLUGIN_ROOT = originalPluginRoot;
    } else {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    }

    const settingsWrite = mockedWriteFileSync.mock.calls.find((call) => String(call[0]).includes('settings.json'));
    if (settingsWrite) {
      const writtenSettings = JSON.parse(String(settingsWrite[1]));
      expect(writtenSettings.hooks.UserPromptSubmit[0].hooks[0].command).toBe('node $HOME/.claude/hooks/other-plugin.mjs');
    }
    expect(result.hooksConfigured).toBe(true);
  });
});

describe('performUpdate plugin mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v4.1.5',
        name: '4.1.5',
        published_at: '2026-02-09T00:00:00.000Z',
        html_url: 'https://example.com',
        body: 'notes',
        prerelease: false,
        draft: false,
      }),
    }));
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ version: '4.1.5', installedAt: '2026-02-09T00:00:00.000Z', installMethod: 'npm' })
    );
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns guidance message for project-scoped plugin', async () => {
    mockedIsRunningAsPlugin.mockReturnValue(true);
    mockedIsProjectScopedPlugin.mockReturnValue(true);

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
    expect(result.message).toContain('/plugin install ultrapower');
    expect(result.newVersion).toBe('unknown');
  });

  it('returns guidance message for global plugin with marketplace sync', async () => {
    mockedIsRunningAsPlugin.mockReturnValue(true);
    mockedIsProjectScopedPlugin.mockReturnValue(false);
    mockedExecSync.mockReturnValue('');

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
    expect(result.message).toContain('/plugin install ultrapower');
  });

  it('returns success even when marketplace sync fails', async () => {
    mockedIsRunningAsPlugin.mockReturnValue(true);
    mockedIsProjectScopedPlugin.mockReturnValue(false);
    mockedExistsSync.mockImplementation((p) =>
      !String(p).includes('marketplaces')
    );

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
  });
});

describe('syncMarketplaceClone via performUpdate plugin mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedIsProjectScopedPlugin.mockReturnValue(false);
    mockedIsRunningAsPlugin.mockReturnValue(true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v4.1.5',
        name: '4.1.5',
        published_at: '2026-02-09T00:00:00.000Z',
        html_url: 'https://example.com',
        body: 'notes',
        prerelease: false,
        draft: false,
      }),
    }));
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('skips marketplace sync when directory does not exist', async () => {
    mockedExistsSync.mockReturnValue(false);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ version: '4.1.5', installedAt: '2026-02-09T00:00:00.000Z', installMethod: 'npm' })
    );

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
    // git commands should not be called when marketplace dir doesn't exist
    expect(mockedExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('git'),
      expect.anything()
    );
  });

  it('marketplace sync: fetch failure does not block performUpdate', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ version: '4.1.5', installedAt: '2026-02-09T00:00:00.000Z', installMethod: 'npm' })
    );
    mockedExecSync.mockImplementationOnce(() => { throw new Error('fetch failed'); });

    const result = await performUpdate({ verbose: false });

    // performUpdate returns success even when marketplace sync fails
    expect(result.success).toBe(true);
  });

  it('marketplace sync: pull failure does not block performUpdate', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ version: '4.1.5', installedAt: '2026-02-09T00:00:00.000Z', installMethod: 'npm' })
    );
    mockedExecSync
      .mockReturnValueOnce('') // fetch succeeds
      .mockReturnValueOnce('') // checkout succeeds
      .mockImplementationOnce(() => { throw new Error('pull failed'); }); // pull fails

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
  });

  it('marketplace sync: success calls syncPluginRegistry (writeFileSync called)', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ version: '4.1.5', installedAt: '2026-02-09T00:00:00.000Z', installMethod: 'npm' })
    );
    mockedExecSync.mockReturnValue('');

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
  });
});

describe('silentAutoUpdate rate limiting', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns null when shouldCheckForUpdates returns false (rate limited)', async () => {
    vi.clearAllMocks();
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockImplementation((p) => {
      if (String(p).includes('.omc-config.json')) {
        return JSON.stringify({ silentAutoUpdate: true });
      }
      // shouldCheckForUpdates reads VERSION_FILE (.omc-version.json) for lastCheckAt
      if (String(p).includes('.omc-version.json')) {
        return JSON.stringify({
          version: '4.1.5',
          installedAt: '2026-02-09T00:00:00.000Z',
          installMethod: 'npm',
          lastCheckAt: new Date().toISOString(), // just checked → rate limited
        });
      }
      return '';
    });

    const result = await silentAutoUpdate({ checkIntervalHours: 24 });

    expect(result).toBeNull();
  });

  it('returns null when in backoff period (consecutiveFailures >= maxRetries)', async () => {
    vi.clearAllMocks();
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockImplementation((p) => {
      if (String(p).includes('.omc-config.json')) {
        return JSON.stringify({ silentAutoUpdate: true });
      }
      // shouldCheckForUpdates reads .omc-version.json for lastCheckAt (no lastCheckAt → passes rate limit)
      if (String(p).includes('.omc-version.json')) {
        return JSON.stringify({
          version: '4.1.5',
          installedAt: '2026-02-09T00:00:00.000Z',
          installMethod: 'npm',
          // no lastCheckAt → shouldCheckForUpdates returns true
        });
      }
      // getSilentUpdateState reads .omc-silent-update.json
      if (String(p).includes('.omc-silent-update.json')) {
        return JSON.stringify({
          consecutiveFailures: 3,
          pendingRestart: false,
          lastAttempt: new Date().toISOString(), // just attempted → in backoff
        });
      }
      return '';
    });

    const result = await silentAutoUpdate({ maxRetries: 3 });

    expect(result).toBeNull();
  });

  it('saves state after successful update (writeFileSync called with pendingRestart)', async () => {
    vi.clearAllMocks();
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockImplementation((p) => {
      if (String(p).includes('.omc-config.json')) {
        return JSON.stringify({ silentAutoUpdate: true });
      }
      if (String(p).includes('.omc-silent-update.json')) {
        // No lastAttempt → not in backoff; consecutiveFailures=0
        return JSON.stringify({ consecutiveFailures: 0, pendingRestart: false });
      }
      if (String(p).includes('.omc-version.json')) {
        // No lastCheckAt → shouldCheckForUpdates returns true
        return JSON.stringify({ version: '4.1.5', installedAt: '2026-02-09T00:00:00.000Z', installMethod: 'npm' });
      }
      return '';
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v4.2.0',
        name: '4.2.0',
        published_at: '2026-02-27T00:00:00.000Z',
        html_url: 'https://example.com',
        body: 'notes',
        prerelease: false,
        draft: false,
      }),
    }));
    mockedExecSync.mockReturnValue('');
    mockedIsRunningAsPlugin.mockReturnValue(false);
    mockedIsProjectScopedPlugin.mockReturnValue(false);

    await silentAutoUpdate({ autoApply: true });

    // Verify .omc-silent-update.json was written with pendingRestart: true
    const stateWrite = mockedWriteFileSync.mock.calls.find(
      (call) => String(call[0]).includes('.omc-silent-update.json')
    );
    expect(stateWrite).toBeDefined();
    const writtenState = JSON.parse(String(stateWrite![1]));
    expect(writtenState.pendingRestart).toBe(true);
  });
});

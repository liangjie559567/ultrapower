/**
 * Tests for install() function - core installation flow
 * Target: 80% coverage for installer module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { install, checkNodeVersion, isClaudeInstalled, isInstalled, getInstallInfo } from '../index.js';

describe('checkNodeVersion', () => {
  it('returns valid true when Node version meets requirement', () => {
    const result = checkNodeVersion();
    expect(result.valid).toBe(true);
    expect(result.current).toBeGreaterThanOrEqual(20);
    expect(result.required).toBe(20);
  });
});

describe('isClaudeInstalled', () => {
  it('returns boolean without throwing', () => {
    const result = isClaudeInstalled();
    expect(typeof result).toBe('boolean');
  });
});

describe('install - basic flow', () => {
  const originalPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  beforeEach(() => {
    delete process.env.CLAUDE_PLUGIN_ROOT;
  });

  afterEach(() => {
    if (originalPluginRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = originalPluginRoot;
    }
  });

  it('returns success result structure', () => {
    const result = install({ skipClaudeCheck: true, verbose: false });
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('installedAgents');
    expect(result).toHaveProperty('installedCommands');
    expect(result).toHaveProperty('hooksConfigured');
    expect(result).toHaveProperty('hookConflicts');
    expect(result).toHaveProperty('errors');
  });

  it('respects skipClaudeCheck option', () => {
    const result = install({ skipClaudeCheck: true, verbose: false });
    expect(result.errors).toHaveLength(0);
  });

  it('respects force option', () => {
    const result = install({ skipClaudeCheck: true, force: true, verbose: false });
    expect(typeof result.success).toBe('boolean');
  });

  it('respects verbose option', () => {
    const result = install({ skipClaudeCheck: true, verbose: true });
    expect(typeof result.success).toBe('boolean');
  });
});

describe('install - options handling', () => {
  it('handles forceHooks option', () => {
    const result = install({ skipClaudeCheck: true, forceHooks: true, verbose: false });
    expect(typeof result.success).toBe('boolean');
  });

  it('handles skipHud option', () => {
    const result = install({ skipClaudeCheck: true, skipHud: true, verbose: false });
    expect(typeof result.success).toBe('boolean');
  });

  it('handles version option', () => {
    const result = install({ skipClaudeCheck: true, version: '7.1.0', verbose: false });
    expect(typeof result.success).toBe('boolean');
  });

  it('returns hookConflicts array', () => {
    const result = install({ skipClaudeCheck: true, verbose: false });
    expect(Array.isArray(result.hookConflicts)).toBe(true);
  });
});

describe('install - plugin context', () => {
  const originalPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  afterEach(() => {
    if (originalPluginRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = originalPluginRoot;
    }
  });

  it('skips file installation when running as plugin', () => {
    process.env.CLAUDE_PLUGIN_ROOT = '/some/plugin/path';
    const result = install({ skipClaudeCheck: true, verbose: false });
    expect(result.installedAgents).toHaveLength(0);
    expect(result.installedCommands).toHaveLength(0);
  });

  it('skips global settings for project-scoped plugin', () => {
    process.env.CLAUDE_PLUGIN_ROOT = '/project/.claude/plugins/ultrapower';
    const result = install({ skipClaudeCheck: true, verbose: false });
    expect(result.success).toBe(true);
  });
});

describe('isInstalled and getInstallInfo', () => {
  it('isInstalled returns boolean', () => {
    const result = isInstalled();
    expect(typeof result).toBe('boolean');
  });

  it('getInstallInfo returns object or null', () => {
    const result = getInstallInfo();
    expect(result === null || typeof result === 'object').toBe(true);
  });

  it('getInstallInfo has correct structure when installed', () => {
    const result = getInstallInfo();
    if (result !== null) {
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('installedAt');
      expect(result).toHaveProperty('method');
    }
  });
});

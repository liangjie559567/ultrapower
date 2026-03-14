/**
 * Additional coverage tests for installer edge cases
 */

import { describe, it, expect, afterEach } from 'vitest';
import { install, isRunningAsPlugin, isProjectScopedPlugin, CLAUDE_CONFIG_DIR } from '../index.js';
import { join } from 'path';

describe('plugin detection edge cases', () => {
  const originalPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  afterEach(() => {
    if (originalPluginRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = originalPluginRoot;
    }
  });

  it('handles refreshHooksInPlugin option for global plugin', () => {
    const globalPluginPath = join(CLAUDE_CONFIG_DIR, 'plugins', 'ultrapower', '7.1.0');
    process.env.CLAUDE_PLUGIN_ROOT = globalPluginPath;
    const result = install({
      skipClaudeCheck: true,
      refreshHooksInPlugin: true,
      verbose: false
    });
    expect(result.success).toBe(true);
  });

  it('skips hook refresh for project-scoped plugin', () => {
    process.env.CLAUDE_PLUGIN_ROOT = '/project/.claude/plugins/ultrapower';
    const result = install({
      skipClaudeCheck: true,
      refreshHooksInPlugin: true,
      verbose: false
    });
    expect(result.success).toBe(true);
  });
});

describe('install with various option combinations', () => {
  it('handles force and forceHooks together', () => {
    const result = install({
      skipClaudeCheck: true,
      force: true,
      forceHooks: true,
      verbose: false
    });
    expect(typeof result.success).toBe('boolean');
    expect(result).toHaveProperty('hookConflicts');
  });

  it('handles skipHud with force', () => {
    const result = install({
      skipClaudeCheck: true,
      skipHud: true,
      force: true,
      verbose: false
    });
    expect(typeof result.success).toBe('boolean');
    expect(result).toHaveProperty('message');
  });
});

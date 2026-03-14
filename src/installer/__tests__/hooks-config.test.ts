/**
 * Tests for hooks configuration
 */

import { describe, it, expect } from 'vitest';
import { getHooksSettingsConfig, getHookScripts, MIN_NODE_VERSION } from '../hooks.js';

describe('hooks configuration', () => {
  it('getHooksSettingsConfig returns valid structure', () => {
    const config = getHooksSettingsConfig();
    expect(config).toHaveProperty('hooks');
    expect(config.hooks).toHaveProperty('UserPromptSubmit');
    expect(config.hooks).toHaveProperty('SessionStart');
    expect(config.hooks).toHaveProperty('PreToolUse');
    expect(config.hooks).toHaveProperty('PostToolUse');
    expect(config.hooks).toHaveProperty('PostToolUseFailure');
    expect(config.hooks).toHaveProperty('Stop');
  });

  it('getHookScripts returns all required scripts', () => {
    const scripts = getHookScripts();
    expect(scripts).toHaveProperty('keyword-detector.mjs');
    expect(scripts).toHaveProperty('session-start.mjs');
    expect(scripts).toHaveProperty('pre-tool-use.mjs');
    expect(scripts).toHaveProperty('post-tool-use.mjs');
    expect(scripts).toHaveProperty('persistent-mode.mjs');
    expect(scripts).toHaveProperty('lib/stdin.mjs');
    expect(scripts).toHaveProperty('lib/atomic-write.mjs');
  });

  it('MIN_NODE_VERSION is defined', () => {
    expect(MIN_NODE_VERSION).toBe(20);
  });
});

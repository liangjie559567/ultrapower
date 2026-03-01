/**
 * Tests for installer hook-related utilities
 * Covers: isOmcStatusLine, isRunningAsPlugin, isProjectScopedPlugin, mergeClaudeMd
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  isOmcStatusLine,
  isRunningAsPlugin,
  isProjectScopedPlugin,
  mergeClaudeMd,
  CLAUDE_CONFIG_DIR,
} from '../index.js';
import { join } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// isOmcStatusLine
// ─────────────────────────────────────────────────────────────────────────────

describe('isOmcStatusLine', () => {
  it('returns true when command contains "omc-hud"', () => {
    expect(isOmcStatusLine({ type: 'command', command: 'node ~/.claude/hud/omc-hud.mjs' })).toBe(true);
  });

  it('returns false when command does not contain "omc-hud"', () => {
    expect(isOmcStatusLine({ type: 'command', command: 'node ~/.claude/hud/custom-hud.mjs' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isOmcStatusLine(null)).toBe(false);
  });

  it('returns false for non-object primitives', () => {
    expect(isOmcStatusLine('string-value')).toBe(false);
    expect(isOmcStatusLine(42)).toBe(false);
    expect(isOmcStatusLine(undefined)).toBe(false);
  });

  it('returns false when command property is missing', () => {
    expect(isOmcStatusLine({ type: 'command' })).toBe(false);
    expect(isOmcStatusLine({})).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isRunningAsPlugin
// ─────────────────────────────────────────────────────────────────────────────

describe('isRunningAsPlugin', () => {
  const originalPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  afterEach(() => {
    if (originalPluginRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = originalPluginRoot;
    }
  });

  it('returns true when CLAUDE_PLUGIN_ROOT is set', () => {
    process.env.CLAUDE_PLUGIN_ROOT = '/some/plugin/root';
    expect(isRunningAsPlugin()).toBe(true);
  });

  it('returns false when CLAUDE_PLUGIN_ROOT is not set', () => {
    delete process.env.CLAUDE_PLUGIN_ROOT;
    expect(isRunningAsPlugin()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isProjectScopedPlugin
// ─────────────────────────────────────────────────────────────────────────────

describe('isProjectScopedPlugin', () => {
  const originalPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  afterEach(() => {
    if (originalPluginRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = originalPluginRoot;
    }
  });

  it('returns false when CLAUDE_PLUGIN_ROOT is not set', () => {
    delete process.env.CLAUDE_PLUGIN_ROOT;
    expect(isProjectScopedPlugin()).toBe(false);
  });

  it('returns false when plugin root is under the global plugins directory', () => {
    const globalPluginDir = join(CLAUDE_CONFIG_DIR, 'plugins', 'ultrapower', '5.5.2');
    process.env.CLAUDE_PLUGIN_ROOT = globalPluginDir;
    expect(isProjectScopedPlugin()).toBe(false);
  });

  it('returns true when plugin root is outside the global plugins directory', () => {
    process.env.CLAUDE_PLUGIN_ROOT = '/some/project/.claude/plugins/ultrapower';
    expect(isProjectScopedPlugin()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mergeClaudeMd
// ─────────────────────────────────────────────────────────────────────────────

const START_MARKER = '<!-- OMC:START -->';
const END_MARKER = '<!-- OMC:END -->';
const OMC_CONTENT = '# OMC Instructions\n\nSome orchestration content.';

describe('mergeClaudeMd', () => {
  it('wraps content in markers when existingContent is null', () => {
    const result = mergeClaudeMd(null, OMC_CONTENT);
    expect(result).toContain(START_MARKER);
    expect(result).toContain(END_MARKER);
    expect(result).toContain(OMC_CONTENT);
  });

  it('replaces existing OMC content between markers while preserving trailing content', () => {
    const existing = `${START_MARKER}\nOld OMC instructions\n${END_MARKER}\n\nUser content here`;
    const result = mergeClaudeMd(existing, OMC_CONTENT);
    expect(result).toContain(OMC_CONTENT);
    expect(result).not.toContain('Old OMC instructions');
    expect(result).toContain('User content here');
  });

  it('preserves existing non-OMC content when no markers present', () => {
    const existing = '# My Project\n\nCustom project notes.';
    const result = mergeClaudeMd(existing, OMC_CONTENT);
    expect(result).toContain(OMC_CONTENT);
    expect(result).toContain('# My Project');
    expect(result).toContain('Custom project notes.');
  });

  it('includes version marker when version string is provided', () => {
    const result = mergeClaudeMd(null, OMC_CONTENT, '5.5.3');
    expect(result).toContain('<!-- OMC:VERSION:5.5.3 -->');
  });

  it('strips existing markers from omcContent to avoid double-wrapping', () => {
    const wrapped = `${START_MARKER}\n${OMC_CONTENT}\n${END_MARKER}`;
    const result = mergeClaudeMd(null, wrapped);
    const startCount = (result.match(/<!-- OMC:START -->/g) || []).length;
    const endCount = (result.match(/<!-- OMC:END -->/g) || []).length;
    expect(startCount).toBe(1);
    expect(endCount).toBe(1);
    expect(result).toContain(OMC_CONTENT);
  });
});

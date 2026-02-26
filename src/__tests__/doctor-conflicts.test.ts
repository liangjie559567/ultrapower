/**
 * Tests for doctor-conflicts command (issue #606)
 *
 * Verifies that OMC-managed hooks are correctly classified as OMC-owned,
 * not falsely flagged as "Other".
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';
import { randomBytes } from 'crypto';

// Mock getClaudeConfigDir before importing the module under test
// Use a factory so each test suite worker gets its own path via the closure
let testClaudeDir = '';
vi.mock('../utils/paths.js', () => ({
  getClaudeConfigDir: () => testClaudeDir,
}));

// Import after mock setup
import { checkHookConflicts, runConflictCheck } from '../cli/commands/doctor-conflicts.js';

describe('doctor-conflicts: hook ownership classification', () => {
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let testProjectDir: string;
  let testProjectClaudeDir: string;

  beforeEach(() => {
    // Use unique directories per test to avoid cross-test filesystem races
    const uid = randomBytes(6).toString('hex');
    testClaudeDir = join(tmpdir(), `omc-test-doctor-${uid}`);
    testProjectDir = join(tmpdir(), `omc-test-project-${uid}`);
    testProjectClaudeDir = join(testProjectDir, '.claude');

    mkdirSync(testClaudeDir, { recursive: true });
    mkdirSync(testProjectClaudeDir, { recursive: true });
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(testProjectDir);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    for (const dir of [testClaudeDir, testProjectDir]) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('classifies real OMC hook commands as OMC-owned (issue #606)', () => {
    // These are the actual commands OMC installs into settings.json
    const settings = {
      hooks: {
        UserPromptSubmit: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/keyword-detector.mjs"',
          }],
        }],
        SessionStart: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/session-start.mjs"',
          }],
        }],
        PreToolUse: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/pre-tool-use.mjs"',
          }],
        }],
        PostToolUse: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/post-tool-use.mjs"',
          }],
        }],
        Stop: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/persistent-mode.mjs"',
          }],
        }],
      },
    };

    writeFileSync(join(testClaudeDir, 'settings.json'), JSON.stringify(settings));
    const conflicts = checkHookConflicts();

    // All hooks should be classified as OMC-owned
    expect(conflicts.length).toBeGreaterThan(0);
    for (const hook of conflicts) {
      expect(hook.isOmc).toBe(true);
    }
  });

  it('classifies Windows-style OMC hook commands as OMC-owned', () => {
    const settings = {
      hooks: {
        PreToolUse: [{
          hooks: [{
            type: 'command',
            command: 'node "%USERPROFILE%\\.claude\\hooks\\pre-tool-use.mjs"',
          }],
        }],
      },
    };

    writeFileSync(join(testClaudeDir, 'settings.json'), JSON.stringify(settings));
    const conflicts = checkHookConflicts();

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].isOmc).toBe(true);
  });

  it('classifies non-OMC hooks as not OMC-owned', () => {
    const settings = {
      hooks: {
        PreToolUse: [{
          hooks: [{
            type: 'command',
            command: 'node ~/other-plugin/hooks/pre-tool.mjs',
          }],
        }],
      },
    };

    writeFileSync(join(testClaudeDir, 'settings.json'), JSON.stringify(settings));
    const conflicts = checkHookConflicts();

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].isOmc).toBe(false);
  });

  it('correctly distinguishes OMC and non-OMC hooks in mixed config', () => {
    const settings = {
      hooks: {
        PreToolUse: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/pre-tool-use.mjs"',
          }],
        }],
        PostToolUse: [{
          hooks: [{
            type: 'command',
            command: 'python ~/other-plugin/post-tool.py',
          }],
        }],
      },
    };

    writeFileSync(join(testClaudeDir, 'settings.json'), JSON.stringify(settings));
    const conflicts = checkHookConflicts();

    expect(conflicts).toHaveLength(2);

    const preTool = conflicts.find(c => c.event === 'PreToolUse');
    const postTool = conflicts.find(c => c.event === 'PostToolUse');

    expect(preTool?.isOmc).toBe(true);
    expect(postTool?.isOmc).toBe(false);
  });

  it('reports hasConflicts only when non-OMC hooks exist', () => {
    // All-OMC config: no conflicts
    const omcOnlySettings = {
      hooks: {
        PreToolUse: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/pre-tool-use.mjs"',
          }],
        }],
      },
    };

    writeFileSync(join(testClaudeDir, 'settings.json'), JSON.stringify(omcOnlySettings));
    const omcReport = runConflictCheck();
    // hasConflicts should be false when all hooks are OMC-owned
    expect(omcReport.hookConflicts.every(h => h.isOmc)).toBe(true);
    expect(omcReport.hookConflicts.some(h => !h.isOmc)).toBe(false);
  });

  it('detects hooks from project-level settings.json (issue #669)', () => {
    // Only project-level settings, no profile-level
    const projectSettings = {
      hooks: {
        PreToolUse: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/pre-tool-use.mjs"',
          }],
        }],
      },
    };

    writeFileSync(join(testProjectClaudeDir, 'settings.json'), JSON.stringify(projectSettings));
    const conflicts = checkHookConflicts();

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].event).toBe('PreToolUse');
    expect(conflicts[0].isOmc).toBe(true);
  });

  it('merges hooks from both profile and project settings (issue #669)', () => {
    const profileSettings = {
      hooks: {
        SessionStart: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/session-start.mjs"',
          }],
        }],
      },
    };
    const projectSettings = {
      hooks: {
        PreToolUse: [{
          hooks: [{
            type: 'command',
            command: 'python ~/my-project/hooks/lint.py',
          }],
        }],
      },
    };

    writeFileSync(join(testClaudeDir, 'settings.json'), JSON.stringify(profileSettings));
    writeFileSync(join(testProjectClaudeDir, 'settings.json'), JSON.stringify(projectSettings));
    const conflicts = checkHookConflicts();

    expect(conflicts).toHaveLength(2);

    const sessionStart = conflicts.find(c => c.event === 'SessionStart');
    const preTool = conflicts.find(c => c.event === 'PreToolUse');

    expect(sessionStart?.isOmc).toBe(true);
    expect(preTool?.isOmc).toBe(false);
  });

  it('deduplicates identical hooks present in both levels (issue #669)', () => {
    const sharedHook = {
      hooks: {
        PreToolUse: [{
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.claude/hooks/pre-tool-use.mjs"',
          }],
        }],
      },
    };

    // Same hook in both profile and project settings
    writeFileSync(join(testClaudeDir, 'settings.json'), JSON.stringify(sharedHook));
    writeFileSync(join(testProjectClaudeDir, 'settings.json'), JSON.stringify(sharedHook));
    const conflicts = checkHookConflicts();

    // Should appear only once, not twice
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].event).toBe('PreToolUse');
    expect(conflicts[0].isOmc).toBe(true);
  });
});

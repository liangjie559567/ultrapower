import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isFirstRun, saveTutorialState, type TutorialState } from '../index.js';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { getConfigDir } from '../../../utils/config-dir.js';

const TUTORIAL_STATE_FILE = join(getConfigDir(), '.tutorial-state.json');

describe('Tutorial System', () => {
  beforeEach(() => {
    if (existsSync(TUTORIAL_STATE_FILE)) {
      unlinkSync(TUTORIAL_STATE_FILE);
    }
  });

  afterEach(() => {
    if (existsSync(TUTORIAL_STATE_FILE)) {
      unlinkSync(TUTORIAL_STATE_FILE);
    }
  });

  it('detects first run when state file missing', () => {
    expect(isFirstRun()).toBe(true);
  });

  it('saves tutorial state', () => {
    const state: TutorialState = {
      completed: true,
      skipped: false,
      lastStep: 3,
      timestamp: Date.now()
    };

    saveTutorialState(state);
    expect(existsSync(TUTORIAL_STATE_FILE)).toBe(true);
    expect(isFirstRun()).toBe(false);
  });
});

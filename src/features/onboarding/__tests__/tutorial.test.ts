import { describe, it, expect, afterEach } from 'vitest';
import { StateManager } from '../state-manager.js';
import { existsSync, unlinkSync } from 'fs';

describe('Tutorial Integration', () => {
  const statePath = '.omc/onboarding/tutorial-state.json';

  afterEach(() => {
    if (existsSync(statePath)) unlinkSync(statePath);
  });

  it('should detect first launch', async () => {
    const state = await StateManager.load();
    expect(state).toBeNull();
  });
});

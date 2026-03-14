import { describe, it, expect } from 'vitest';
import { renderBackground } from '../../hud/elements/background.js';
import type { BackgroundTask } from '../../hud/types.js';

describe('Background Element', () => {
  it('renders running tasks', () => {
    const tasks: BackgroundTask[] = [
      { id: '1', status: 'running', description: 'Test', startedAt: new Date().toISOString() }
    ];
    const result = renderBackground(tasks);
    expect(result).toBeTruthy();
  });

  it('returns null for no running tasks', () => {
    expect(renderBackground([])).toBeNull();
  });
});

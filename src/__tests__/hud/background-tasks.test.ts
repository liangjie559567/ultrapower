import { describe, it, expect, vi } from 'vitest';
import { addBackgroundTask, completeBackgroundTask } from '../../hud/background-tasks.js';
import { readHudState, writeHudState } from '../../hud/state.js';

vi.mock('../../hud/state.js');

describe('Background Tasks', () => {
  const dir = '/test';

  it('adds task to state', () => {
    vi.mocked(readHudState).mockReturnValue({ backgroundTasks: [], timestamp: '' });
    vi.mocked(writeHudState).mockReturnValue(true);

    const result = addBackgroundTask('task1', 'Test task', 'executor', dir);

    expect(result).toBe(true);
    expect(writeHudState).toHaveBeenCalled();
  });

  it('completes task successfully', () => {
    vi.mocked(readHudState).mockReturnValue({
      backgroundTasks: [{ id: 'task1', status: 'running', description: 'Test' }],
      timestamp: ''
    });
    vi.mocked(writeHudState).mockReturnValue(true);

    const result = completeBackgroundTask('task1', dir);

    expect(result).toBe(true);
  });

  it('returns false when state not found', () => {
    vi.mocked(readHudState).mockReturnValue(null);

    expect(completeBackgroundTask('task1', dir)).toBe(false);
  });
});

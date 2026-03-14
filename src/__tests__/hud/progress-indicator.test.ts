import { describe, it, expect, vi } from 'vitest';
import { aggregateProgress, formatProgress } from '../../hud/progress-indicator.js';
import { existsSync, readFileSync } from 'fs';

vi.mock('fs');

describe('Progress Indicator', () => {
  const cwd = '/test';

  it('returns null when team not active', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('{"active":false}');
    expect(aggregateProgress(cwd)).toBeNull();
  });

  it('calculates progress correctly', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('{"active":true,"current_phase":"exec"}');

    const result = aggregateProgress(cwd);
    expect(result).toMatchObject({
      mode: 'TEAM',
      phase: 'exec',
      percentage: 0
    });
  });

  it('formats progress with bar and icons', () => {
    const data = {
      mode: 'TEAM',
      phase: 'exec',
      completed: 3,
      total: 5,
      percentage: 60,
      statusCounts: { success: 3, warning: 0, error: 0, running: 1 }
    };

    const result = formatProgress(data);
    expect(result).toContain('TEAM');
    expect(result).toContain('exec');
    expect(result).toContain('3/5');
    expect(result).toContain('60%');
  });
});

import { describe, it, expect } from 'vitest';
import { renderSession } from '../../hud/elements/session.js';

describe('Session Element', () => {
  it('renders session duration', () => {
    const result = renderSession({ durationMinutes: 60, health: 'healthy' });
    expect(result).toContain('60m');
  });

  it('returns null for null session', () => {
    expect(renderSession(null)).toBeNull();
  });
});

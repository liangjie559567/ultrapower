import { describe, it, expect } from 'vitest';
import { renderPrd } from '../../hud/elements/prd.js';
import type { PrdStateForHud } from '../../hud/types.js';

describe('PRD Element', () => {
  it('renders current story', () => {
    const state: PrdStateForHud = { currentStoryId: 'US-001', completed: 1, total: 5 };
    const result = renderPrd(state);
    expect(result).toContain('US-001');
  });

  it('returns null for null state', () => {
    expect(renderPrd(null)).toBeNull();
  });
});

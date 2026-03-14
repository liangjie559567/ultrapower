import { describe, it, expect } from 'vitest';
import { renderRalph } from '../../hud/elements/ralph.js';
import type { RalphStateForHud } from '../../hud/types.js';

describe('Ralph Element', () => {
  const thresholds = { ralphWarning: 7, contextWarning: 70, contextCompactSuggestion: 80, contextCritical: 85, budgetWarning: 2, budgetCritical: 5 };

  it('renders active ralph state', () => {
    const state: RalphStateForHud = { active: true, iteration: 5, maxIterations: 10 };
    const result = renderRalph(state, thresholds);
    expect(result).toContain('5');
  });

  it('returns null for inactive state', () => {
    expect(renderRalph(null, thresholds)).toBeNull();
  });
});

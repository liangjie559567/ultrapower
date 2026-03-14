import { describe, it, expect } from 'vitest';
import { renderAutopilot } from '../../hud/elements/autopilot.js';
import type { AutopilotStateForHud } from '../../hud/elements/autopilot.js';

describe('Autopilot Element', () => {
  const thresholds = { ralphWarning: 7, contextWarning: 70, contextCompactSuggestion: 80, contextCritical: 85, budgetWarning: 2, budgetCritical: 5 };

  it('renders active autopilot', () => {
    const state: AutopilotStateForHud = { active: true, phase: 'execution', iteration: 1, maxIterations: 10 };
    const result = renderAutopilot(state, thresholds);
    expect(result).toBeTruthy();
  });

  it('returns null for inactive', () => {
    expect(renderAutopilot(null, thresholds)).toBeNull();
  });
});

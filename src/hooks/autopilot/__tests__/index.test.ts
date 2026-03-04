import { describe, it, expect } from 'vitest';
import * as autopilot from '../index.js';

describe('Autopilot Module Exports', () => {
  it('should export all type definitions', () => {
    expect(autopilot.DEFAULT_CONFIG).toBeDefined();
  });

  it('should export state management functions', () => {
    expect(autopilot.readAutopilotState).toBeDefined();
    expect(autopilot.writeAutopilotState).toBeDefined();
    expect(autopilot.clearAutopilotState).toBeDefined();
    expect(autopilot.isAutopilotActive).toBeDefined();
    expect(autopilot.initAutopilot).toBeDefined();
    expect(autopilot.transitionPhase).toBeDefined();
  });

  it('should export prompt generation functions', () => {
    expect(autopilot.getExpansionPrompt).toBeDefined();
    expect(autopilot.getDirectPlanningPrompt).toBeDefined();
    expect(autopilot.getExecutionPrompt).toBeDefined();
    expect(autopilot.getQAPrompt).toBeDefined();
    expect(autopilot.getValidationPrompt).toBeDefined();
    expect(autopilot.getPhasePrompt).toBeDefined();
  });

  it('should export validation functions', () => {
    expect(autopilot.recordValidationVerdict).toBeDefined();
    expect(autopilot.getValidationStatus).toBeDefined();
    expect(autopilot.generateSummary).toBeDefined();
  });

  it('should export cancellation functions', () => {
    expect(autopilot.cancelAutopilot).toBeDefined();
    expect(autopilot.clearAutopilot).toBeDefined();
  });

  it('should export enforcement functions', () => {
    expect(autopilot.detectSignal).toBeDefined();
    expect(autopilot.checkAutopilot).toBeDefined();
  });
});

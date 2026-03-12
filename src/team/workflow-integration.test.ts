import { describe, it, expect } from 'vitest';
import { getTeamWorkerPrompt, TEAM_WORKFLOW_PREAMBLE } from './workflow-integration.js';

describe('team-workflow-integration', () => {
  it('includes Socratic workflow preamble', () => {
    const prompt = getTeamWorkerPrompt('Fix auth bug', 'worker-1');
    expect(prompt).toContain('SOCRATIC WORKFLOW DISCIPLINE');
    expect(prompt).toContain('5W1H');
    expect(prompt).toContain('TDD');
    expect(prompt).toContain('Quality Gates');
  });

  it('includes task description', () => {
    const prompt = getTeamWorkerPrompt('Fix auth bug', 'worker-1');
    expect(prompt).toContain('Fix auth bug');
  });

  it('includes worker identity', () => {
    const prompt = getTeamWorkerPrompt('Fix auth bug', 'worker-1');
    expect(prompt).toContain('worker-1');
  });

  it('preamble covers all 5 phases', () => {
    expect(TEAM_WORKFLOW_PREAMBLE).toContain('Clarify Requirements');
    expect(TEAM_WORKFLOW_PREAMBLE).toContain('Research Best Practices');
    expect(TEAM_WORKFLOW_PREAMBLE).toContain('Propose Approaches');
    expect(TEAM_WORKFLOW_PREAMBLE).toContain('Write Tests First');
    expect(TEAM_WORKFLOW_PREAMBLE).toContain('Quality Gates');
  });
});

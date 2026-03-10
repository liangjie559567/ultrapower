import { describe, it, expect } from 'vitest';
import { getAgentNames, getSkillNames, getCompletions } from '../autocomplete.js';

describe('Autocomplete', () => {
  it('should return agent names', () => {
    const agents = getAgentNames();
    expect(agents).toContain('executor');
    expect(agents).toContain('architect');
    expect(agents.length).toBeGreaterThan(40);
  });

  it('should return skill names', () => {
    const skills = getSkillNames();
    expect(skills).toContain('autopilot');
    expect(skills).toContain('ralph');
    expect(skills.length).toBeGreaterThan(20);
  });

  it('should filter completions by prefix', () => {
    const results = getCompletions('exe');
    expect(results).toContain('executor');
    expect(results).not.toContain('architect');
  });

  it('should return agent-only completions', () => {
    const results = getCompletions('auto', 'agent');
    expect(results).toEqual([]);
  });

  it('should return skill-only completions', () => {
    const results = getCompletions('auto', 'skill');
    expect(results).toContain('autopilot');
  });
});

/**
 * Spec Kit Core Tests
 */

import { describe, it, expect } from 'vitest';
import { generateConstitution, formatConstitution } from '../constitution.js';
import { generateSpecification } from '../specify.js';
import { generatePlan } from '../plan.js';
import { generateTasks } from '../tasks.js';

describe('Spec Kit Core', () => {
  it('should reject path traversal in constitution', async () => {
    await expect(generateConstitution('../../../etc')).rejects.toThrow('Path traversal detected');
  });

  it('should generate constitution with project analysis', async () => {
    const constitution = await generateConstitution(process.cwd());
    expect(constitution.projectName).toBe('ultrapower');
    expect(constitution.principles.length).toBeGreaterThan(0);
    expect(constitution.principles.some(p => p.title.includes('Type Safety'))).toBe(true);
  });

  it('should format constitution', async () => {
    const constitution = await generateConstitution(process.cwd());
    const markdown = formatConstitution(constitution);
    expect(markdown).toContain('# ultrapower Constitution');
    expect(markdown).toContain('## Core Principles');
  });

  it('should generate specification with feature type inference', async () => {
    const constitution = await generateConstitution(process.cwd());
    const spec = await generateSpecification('user-auth-api', constitution);
    expect(spec.feature).toBe('user-auth-api');
    expect(spec.requirements.length).toBeGreaterThan(2);
    expect(spec.overview).toContain('Authentication');
  });

  it('should generate plan with dependencies', async () => {
    const constitution = await generateConstitution(process.cwd());
    const spec = await generateSpecification('api-endpoint', constitution);
    const plan = await generatePlan(spec, process.cwd());
    expect(plan.components.length).toBeGreaterThan(0);
    expect(plan.risks.length).toBeGreaterThan(0);
  });

  it('should reject invalid feature names in plan', async () => {
    const constitution = await generateConstitution(process.cwd());
    const spec = await generateSpecification('../../../etc', constitution);
    await expect(generatePlan(spec, process.cwd())).rejects.toThrow('path traversal detected');
  });

  it('should generate tasks with proper dependencies', async () => {
    const constitution = await generateConstitution(process.cwd());
    const spec = await generateSpecification('test-feature', constitution);
    const plan = await generatePlan(spec);
    const tasks = await generateTasks(plan, spec);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].id).toMatch(/TASK-\d{3}/);
    const testTask = tasks.find(t => t.title.includes('Test'));
    if (testTask) {
      expect(testTask.dependencies.length).toBeGreaterThan(0);
    }
  });
});

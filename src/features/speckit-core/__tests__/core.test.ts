/**
 * Spec Kit Core Tests
 */

import { describe, it, expect } from 'vitest';
import { generateConstitution, formatConstitution } from '../constitution.js';
import { generateSpecification, formatSpecification } from '../specify.js';
import { generatePlan, formatPlan } from '../plan.js';
import { generateTasks, formatTasks } from '../tasks.js';

describe('Spec Kit Core', () => {
  it('should generate constitution', async () => {
    const constitution = await generateConstitution(process.cwd());
    expect(constitution.projectName).toBe('ultrapower');
    expect(constitution.principles.length).toBeGreaterThan(0);
  });

  it('should format constitution', async () => {
    const constitution = await generateConstitution(process.cwd());
    const markdown = formatConstitution(constitution);
    expect(markdown).toContain('# ultrapower Constitution');
    expect(markdown).toContain('## Core Principles');
  });

  it('should generate specification', async () => {
    const constitution = await generateConstitution(process.cwd());
    const spec = await generateSpecification('test-feature', constitution);
    expect(spec.feature).toBe('test-feature');
    expect(spec.requirements.length).toBeGreaterThan(0);
  });

  it('should generate plan', async () => {
    const constitution = await generateConstitution(process.cwd());
    const spec = await generateSpecification('test-feature', constitution);
    const plan = await generatePlan(spec);
    expect(plan.components.length).toBeGreaterThan(0);
  });

  it('should generate tasks', async () => {
    const constitution = await generateConstitution(process.cwd());
    const spec = await generateSpecification('test-feature', constitution);
    const plan = await generatePlan(spec);
    const tasks = await generateTasks(plan);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].id).toMatch(/TASK-\d{3}/);
  });
});

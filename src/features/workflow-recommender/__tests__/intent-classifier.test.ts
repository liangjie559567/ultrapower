import { describe, it, expect } from 'vitest';
import { classifyIntent } from './intent-classifier.js.js';

describe('Intent Classifier', () => {
  it('classifies single feature intent', () => {
    expect(classifyIntent('add a new login feature')).toBe('feature-single');
  });

  it('classifies multiple features intent', () => {
    expect(classifyIntent('implement multiple API endpoints')).toBe('feature-multiple');
  });

  it('classifies bug fix intent', () => {
    expect(classifyIntent('fix the authentication bug')).toBe('bug-fix');
  });

  it('classifies refactor intent', () => {
    expect(classifyIntent('refactor the database layer')).toBe('refactor');
  });

  it('classifies review intent', () => {
    expect(classifyIntent('review the code changes')).toBe('review');
  });

  it('classifies explore intent', () => {
    expect(classifyIntent('explore the codebase')).toBe('explore');
  });

  it('classifies plan intent', () => {
    expect(classifyIntent('plan the architecture')).toBe('plan');
  });

  it('defaults to feature-single for unknown', () => {
    expect(classifyIntent('do something')).toBe('feature-single');
  });
});

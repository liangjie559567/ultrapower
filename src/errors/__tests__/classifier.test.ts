import { describe, it, expect } from 'vitest';
import { classifyError, createFriendlyError } from '../classifier.js';
import { ErrorCategory } from '../types.js';

describe('classifyError', () => {
  it('classifies user input errors', () => {
    expect(classifyError('unknown command: foo')).toBe(ErrorCategory.USER_INPUT);
    expect(classifyError('invalid argument')).toBe(ErrorCategory.USER_INPUT);
  });

  it('classifies not found errors', () => {
    expect(classifyError('ENOENT: no such file')).toBe(ErrorCategory.NOT_FOUND);
  });

  it('classifies permission errors', () => {
    expect(classifyError('EACCES: permission denied')).toBe(ErrorCategory.PERMISSION);
  });

  it('classifies network errors', () => {
    expect(classifyError('ECONNREFUSED')).toBe(ErrorCategory.NETWORK);
  });
});

describe('createFriendlyError', () => {
  it('creates friendly error with recovery steps', () => {
    const error = createFriendlyError('unknown command: foo', {
      command: 'foo',
      availableCommands: ['run', 'init'],
    });

    expect(error.category).toBe(ErrorCategory.USER_INPUT);
    expect(error.recoverySteps.length).toBeGreaterThan(0);
  });

  it('suggests spelling correction', () => {
    const error = createFriendlyError('unknown command: initt', {
      command: 'initt',
      availableCommands: ['init', 'setup'],
    });

    expect(error.suggestedCommand).toBe('init');
  });
});

import { describe, it, expect } from 'vitest';
import { detectInterruptedTask } from '../session-detector.js';

describe('Session Recovery Integration', () => {
  it('should detect no task when file missing', () => {
    const result = detectInterruptedTask('/nonexistent');
    expect(result.hasTask).toBe(false);
  });
});

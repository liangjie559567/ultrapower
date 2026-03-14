import { describe, it, expect } from 'vitest';
import { validateAssumptions } from '../validator.js';

describe('Assumption Validator Integration', () => {
  it('should validate assumptions', () => {
    const result = validateAssumptions([
      { id: '1', description: 'API returns JSON', verificationMethod: 'code', verified: true }
    ]);
    expect(result.valid).toBe(true);
  });

  it('should detect failed assumptions', () => {
    const result = validateAssumptions([
      { id: '1', description: 'API returns JSON', verificationMethod: 'code', verified: false }
    ]);
    expect(result.valid).toBe(false);
    expect(result.shouldStop).toBe(true);
  });
});

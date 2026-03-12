export interface Assumption {
  id: string;
  description: string;
  verificationMethod: 'code' | 'documentation';
  verified: boolean;
  evidence?: string;
}

export interface ValidationResult {
  valid: boolean;
  failedAssumptions: Assumption[];
  shouldStop: boolean;
}

export function validateAssumptions(assumptions: Assumption[]): ValidationResult {
  const failed = assumptions.filter(a => !a.verified);
  return {
    valid: failed.length === 0,
    failedAssumptions: failed,
    shouldStop: failed.length > 0
  };
}

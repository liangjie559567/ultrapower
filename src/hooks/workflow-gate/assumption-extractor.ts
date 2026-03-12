import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Assumption } from '../../features/assumption-validator/index.js';

/**
 * Extract assumptions from plan file
 */
export function extractAssumptionsFromPlan(workingDir: string): Assumption[] {
  const planPath = join(workingDir, '.omc/plans/plan.md');

  if (!existsSync(planPath)) {
    return [];
  }

  const content = readFileSync(planPath, 'utf-8');
  const assumptions: Assumption[] = [];

  // Match patterns like "Assumption: ..." or "假设: ..."
  const assumptionRegex = /(?:Assumption|假设):\s*(.+?)(?:\n|$)/gi;
  let match;
  let id = 1;

  while ((match = assumptionRegex.exec(content)) !== null) {
    assumptions.push({
      id: `assumption-${id++}`,
      description: match[1].trim(),
      verificationMethod: 'code',
      verified: false
    });
  }

  return assumptions;
}

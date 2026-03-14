import { readFileSync } from 'fs';

export interface QualityCheckResult {
  passed: boolean;
  issues: string[];
  score: number;
}

/**
 * Synchronous quality gate check for hook context
 */
export function runQualityGateSync(
  files: string[],
  cwd: string,
  skipRequested?: boolean
): QualityCheckResult {
  if (skipRequested) {
    return { passed: true, issues: [], score: 100 };
  }

  const issues: string[] = [];
  let score = 100;

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    try {
      const content = readFileSync(file, 'utf8');

      if (content.includes('TODO') || content.includes('FIXME')) {
        issues.push(`${file}: Contains TODO/FIXME`);
        score -= 10;
      }

      if (content.includes('console.log')) {
        issues.push(`${file}: Contains console.log`);
        score -= 5;
      }

      if (content.includes(': any')) {
        issues.push(`${file}: Uses 'any' type`);
        score -= 5;
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return {
    passed: score >= 60,
    issues,
    score: Math.max(0, score)
  };
}

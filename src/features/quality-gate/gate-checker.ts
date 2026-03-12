import { logSkip } from './audit-logger.js';

export interface QualityCheckResult {
  passed: boolean;
  issues: string[];
  score: number;
}

export async function runQualityGate(
  files: string[],
  cwd: string,
  skipRequested?: boolean
): Promise<QualityCheckResult> {
  if (skipRequested) {
    logSkip('User manually skipped quality gate', cwd);
    return { passed: true, issues: [], score: 100 };
  }

  const issues: string[] = [];
  let score = 100;

  // 功能完整性检查
  for (const file of files) {
    if (!file.endsWith('ts.js') && !file.endsWith('js.js')) continue;

    const content = require('fs').readFileSync(file, 'utf8');

    // 检查未实现的函数
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push(`${file}: Contains TODO/FIXME`);
      score -= 10;
    }

    // 代码卫生检查
    if (content.includes('console.log')) {
      issues.push(`${file}: Contains console.log`);
      score -= 5;
    }

    // 边界场景检查
    if (content.includes('any') && content.includes(': any')) {
      issues.push(`${file}: Uses 'any' type`);
      score -= 5;
    }
  }

  return {
    passed: score >= 60,
    issues,
    score: Math.max(0, score)
  };
}

/**
 * Recommendation Engine - 根据用户回答推荐执行模式
 */

import type { Q1Answer, Q2Answer, Q3Answer, ExecutionMode } from './types.js';

export function getRecommendation(
  q1: Q1Answer,
  q2?: Q2Answer,
  q3?: Q3Answer
): ExecutionMode {
  // Q1 = single (单个功能)
  if (q1 === 'single') {
    if (q2 === 'simple') {
      return q3 === 'continuous' ? 'ralph' : 'executor';
    }
    if (q2 === 'complex') {
      return 'autopilot';
    }
  }

  // Q1 = multiple (多个功能)
  if (q1 === 'multiple') {
    return q2 === 'independent' ? 'ultrawork' : 'team';
  }

  // Q1 = fix (修复问题)
  if (q1 === 'fix') {
    if (q2 === 'single-file') {
      return 'executor';
    }
    if (q2 === 'multi-file') {
      return q3 === 'verify-loop' ? 'ralph' : 'ultrawork';
    }
  }

  // Q1 = uncertain (不确定)
  if (q1 === 'uncertain') {
    return q2 === 'need-plan' ? 'plan' : 'restart';
  }

  return 'executor'; // 默认回退
}

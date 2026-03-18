/**
 * Keyword Conflict Resolver
 * Detects and resolves conflicts between multiple detected keywords
 */

import type { KeywordType } from './index.js';

export interface ConflictResolution {
  hasConflict: boolean;
  winner: KeywordType | null;
  loser: KeywordType | null;
  reason: string;
}

/**
 * Detect and resolve conflicts between keywords
 */
export function resolveConflict(keywords: KeywordType[]): ConflictResolution {
  if (keywords.length < 2) {
    return { hasConflict: false, winner: null, loser: null, reason: '' };
  }

  // ralph + ultrawork: 非互斥，可共存
  // ralph 提供持久循环，ultrawork 提供并行执行

  // autopilot + ultrapilot: 互斥
  if (keywords.includes('autopilot') && keywords.includes('ultrapilot')) {
    return {
      hasConflict: true,
      winner: 'ultrapilot',
      loser: 'autopilot',
      reason: 'ultrapilot提供文件所有权分区的并行autopilot'
    };
  }

  // team + autopilot: team wins (已在getAllKeywords中处理)
  if (keywords.includes('team') && keywords.includes('autopilot')) {
    return {
      hasConflict: true,
      winner: 'team',
      loser: 'autopilot',
      reason: 'team模式提供多agent协调能力'
    };
  }

  return { hasConflict: false, winner: null, loser: null, reason: '' };
}

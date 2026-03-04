/**
 * Workflow Recommender Types
 */

export type Intent =
  | 'feature-single'
  | 'feature-multiple'
  | 'bug-fix'
  | 'refactor'
  | 'review'
  | 'explore'
  | 'plan';

export type ContextSignal = {
  fileCount?: number;
  hasArchitecture?: boolean;
  hasSecurity?: boolean;
  hasPerformance?: boolean;
  hasUI?: boolean;
  hasAPI?: boolean;
  hasTests?: boolean;
};

export type Recommendation = {
  primary: string;
  secondary?: string;
  confidence: number;
  reason: string;
};

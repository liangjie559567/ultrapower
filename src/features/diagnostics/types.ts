/**
 * Diagnostics Types
 */

export type ErrorCategory =
  | 'hook-failure'
  | 'agent-timeout'
  | 'state-corruption'
  | 'performance'
  | 'build-error'
  | 'network-error'
  | 'permission-error'
  | 'unknown';

export interface ErrorPattern {
  id: string;
  category: ErrorCategory;
  pattern: RegExp;
  keywords: string[];
  priority: number;
}

export interface Solution {
  title: string;
  steps: string[];
  docLink?: string;
  autoFixable?: boolean;
}

export interface DiagnosticResult {
  matched: boolean;
  category: ErrorCategory;
  errorId: string;
  confidence: number;
  solutions: Solution[];
}

/**
 * Wizard Types - 向导类型定义
 */

export type Q1Answer = 'single' | 'multiple' | 'fix' | 'uncertain';
export type Q2Answer = 'simple' | 'complex' | 'independent' | 'dependent' | 'single-file' | 'multi-file' | 'need-plan' | 'no-plan';
export type Q3Answer = 'continuous' | 'basic' | 'verify-loop' | 'one-time';

export type ExecutionMode = 'executor' | 'ralph' | 'autopilot' | 'ultrawork' | 'team' | 'plan' | 'restart';

export interface WizardState {
  q1?: Q1Answer;
  q2?: Q2Answer;
  q3?: Q3Answer;
  recommendation?: ExecutionMode;
}

export interface Question {
  id: string;
  text: string;
  options: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

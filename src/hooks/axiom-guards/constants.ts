/**
 * Axiom Guards Hook - Constants
 */

export const CI_COMMANDS = [
  'tsc --noEmit',
  'npm run build',
  'npm test',
] as const;

export const EXPERT_GATE_MESSAGE =
  '新功能需求必须先经过 /ax-draft → /ax-review 流程。';

export const USER_GATE_MESSAGE =
  'PRD 已生成，是否确认执行？(Yes/No)';

export const CI_GATE_MESSAGE =
  '代码修改完成后必须执行: tsc --noEmit && npm run build && npm test';

export const COMPLEXITY_GATE_THRESHOLD_DAYS = 1;

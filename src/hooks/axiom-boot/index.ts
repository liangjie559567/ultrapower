/**
 * Axiom Boot Hook - Main Entry
 *
 * Injects Axiom memory context at session start when .omc/axiom/ exists.
 */

import {
  isAxiomEnabled,
  readActiveContext,
  parseAxiomState,
  readProjectDecisions,
  readUserPreferences,
} from './storage.js';
import type { AxiomBootInput, AxiomBootOutput } from './types.js';

export * from './types.js';
export * from './storage.js';

export function processAxiomBoot(input: AxiomBootInput): AxiomBootOutput {
  const { workingDirectory } = input;

  if (!isAxiomEnabled(workingDirectory)) {
    return { contextInjected: false, state: null };
  }

  const activeContextContent = readActiveContext(workingDirectory);
  if (!activeContextContent) {
    return { contextInjected: false, state: null };
  }

  const state = parseAxiomState(activeContextContent);

  let message: string;
  switch (state.status) {
    case 'IDLE':
      message = 'Axiom 系统就绪，请输入需求。';
      break;
    case 'EXECUTING':
      message = `检测到中断的任务 ${state.activeTaskId ?? ''}，是否继续？`;
      break;
    case 'BLOCKED':
      message = '上次任务遇到问题，需要人工介入。运行 /ax-status 查看详情。';
      break;
    default:
      message = `Axiom 状态: ${state.status}`;
  }

  return { contextInjected: true, state, message };
}

export function buildAxiomBootContext(workingDirectory: string): string {
  const decisions = readProjectDecisions(workingDirectory);
  const preferences = readUserPreferences(workingDirectory);
  const activeContext = readActiveContext(workingDirectory);

  const parts: string[] = ['## Axiom 上下文'];
  if (activeContext) parts.push(`### 当前状态\n${activeContext}`);
  if (decisions) parts.push(`### 架构决策\n${decisions}`);
  if (preferences) parts.push(`### 用户偏好\n${preferences}`);

  return parts.join('\n\n');
}

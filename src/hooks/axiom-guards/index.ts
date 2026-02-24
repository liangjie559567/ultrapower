/**
 * Axiom Guards Hook - Main Entry
 *
 * Enforces Axiom gatekeeper rules (Expert Gate, User Gate, CI Gate).
 */

import {
  EXPERT_GATE_MESSAGE,
  CI_GATE_MESSAGE,
} from './constants.js';
import type { AxiomGuardsInput, AxiomGuardsOutput } from './types.js';

export * from './types.js';
export * from './constants.js';

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit']);

export function processAxiomGuards(input: AxiomGuardsInput): AxiomGuardsOutput {
  const { toolName, toolInput } = input;

  // CI Gate: remind after write/edit operations
  if (WRITE_TOOLS.has(toolName)) {
    const filePath = (toolInput['file_path'] as string) ?? '';
    if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
      return {
        blocked: false,
        suggestion: CI_GATE_MESSAGE,
      };
    }
  }

  return { blocked: false };
}

export function checkExpertGate(userIntent: string): boolean {
  const newFeatureKeywords = ['新功能', '添加', '新增', '实现', '构建', '创建'];
  return newFeatureKeywords.some(kw => userIntent.includes(kw));
}

export function getExpertGateMessage(): string {
  return EXPERT_GATE_MESSAGE;
}

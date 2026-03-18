import { expect } from 'vitest';
import type { RequirementClarifierState } from '../../../src/agents/zerodev/types';
import { ZeroDevStateManager } from '../../../src/agents/zerodev/state-manager';
import { generateCode, matchTemplate, checkQuality } from '../../../src/agents/zerodev/code-generator';
import { detectPlatform, extractRequirements } from '../../../src/agents/zerodev/requirement-clarifier';

export function createMockState(overrides?: Partial<RequirementClarifierState>): RequirementClarifierState {
  return {
    agentType: 'requirement-clarifier',
    sessionId: 'test-session-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'idle',
    conversationHistory: [],
    platformType: undefined,
    requirements: { functional: [], nonFunctional: [] },
    clarificationRound: 0,
    maxRounds: 10,
    ...overrides
  };
}

export function createTestSession(id?: string): { stateManager: ZeroDevStateManager; sessionId: string } {
  return {
    stateManager: new ZeroDevStateManager(),
    sessionId: id || 'test-session-001'
  };
}

export function expectValidationError(fn: () => void, message?: string): void {
  expect(fn).toThrow(message);
}

export function expectInputError(fn: () => void): void {
  expect(fn).toThrow();
}

export function expectCodeContains(template: string, vars: Record<string, any>, ...expectedStrings: string[]): void {
  const code = generateCode(template, vars);
  expectedStrings.forEach(str => expect(code).toContain(str));
}

export function expectValidClassName(template: string, className: string): void {
  const code = generateCode(template, { className });
  expect(code).toContain(className);
}

export function expectPlatform(input: string, expected: string, memory?: any): void {
  expect(detectPlatform(input, memory)).toBe(expected);
}

export function expectTemplate(requirement: string, expected: string): void {
  expect(matchTemplate(requirement)).toBe(expected);
}

export async function expectQualityScore(code: string, min: number, max: number = 100): Promise<void> {
  const score = await checkQuality(code);
  expect(score).toBeGreaterThanOrEqual(min);
  expect(score).toBeLessThanOrEqual(max);
}

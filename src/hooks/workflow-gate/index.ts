/**
 * Workflow Gate Hook
 *
 * Enforces superpowers workflow discipline by detecting when users
 * skip required steps and automatically injecting the correct skill.
 *
 * Workflow stages:
 * 1. brainstorming (required before any implementation)
 * 2. writing-plans (required after brainstorming)
 * 3. using-git-worktrees (recommended before execution)
 * 4. execution (subagent-driven-development or executing-plans)
 * 5. requesting-code-review (required before completion)
 * 6. verification-before-completion (required before merge)
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface WorkflowState {
  brainstormingComplete: boolean;
  planWritten: boolean;
  worktreeCreated: boolean;
  executionStarted: boolean;
  reviewRequested: boolean;
  verificationComplete: boolean;
  lastStage: string;
  timestamp: number;
}

export interface WorkflowGateInput {
  type: 'UserPromptSubmit';
  prompt: string;
  workingDirectory: string;
}

export interface WorkflowGateOutput {
  success: boolean;
  shouldBlock: boolean;
  injectedSkill?: string;
  message?: string;
}

const WORKFLOW_STATE_FILE = '.omc/workflow-state.json';

/**
 * Get workflow state file path
 */
export function getWorkflowStatePath(workingDir: string): string {
  return join(workingDir, WORKFLOW_STATE_FILE);
}

/**
 * Read current workflow state
 */
export function readWorkflowState(workingDir: string): WorkflowState | null {
  const statePath = getWorkflowStatePath(workingDir);
  if (!existsSync(statePath)) {
    return null;
  }

  try {
    const content = readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Write workflow state
 */
export function writeWorkflowState(workingDir: string, state: WorkflowState): void {
  const statePath = getWorkflowStatePath(workingDir);
  const dir = join(workingDir, '.omc');

  if (!existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }

  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Initialize workflow state
 */
export function initWorkflowState(workingDir: string): WorkflowState {
  const state: WorkflowState = {
    brainstormingComplete: false,
    planWritten: false,
    worktreeCreated: false,
    executionStarted: false,
    reviewRequested: false,
    verificationComplete: false,
    lastStage: 'init',
    timestamp: Date.now()
  };

  writeWorkflowState(workingDir, state);
  return state;
}

/**
 * Detect implementation keywords that require brainstorming first
 */
export function detectImplementationIntent(prompt: string): boolean {
  const implementationKeywords = [
    'implement', 'create', 'add', 'build', 'develop',
    'write code', 'make a', 'generate', 'construct',
    '实现', '创建', '添加', '构建', '开发', '编写代码', '生成'
  ];

  const lowerPrompt = prompt.toLowerCase();
  return implementationKeywords.some(kw => lowerPrompt.includes(kw));
}

/**
 * Detect plan execution keywords
 */
export function detectExecutionIntent(prompt: string): boolean {
  const executionKeywords = [
    'execute', 'run', 'start', 'begin implementation',
    '执行', '运行', '开始实现'
  ];

  const lowerPrompt = prompt.toLowerCase();
  return executionKeywords.some(kw => lowerPrompt.includes(kw));
}

/**
 * Check if brainstorming skill was just completed
 */
export function detectBrainstormingComplete(prompt: string): boolean {
  return prompt.includes('brainstorming') &&
         (prompt.includes('complete') || prompt.includes('完成'));
}

/**
 * Check if plan was just written
 */
export function detectPlanComplete(prompt: string): boolean {
  return (prompt.includes('plan') || prompt.includes('writing-plans')) &&
         (prompt.includes('complete') || prompt.includes('written') || prompt.includes('完成'));
}

/**
 * Detect if user is trying to use executing-plans or subagent-driven-development
 */
export function detectPlanExecutionSkill(prompt: string): boolean {
  return prompt.includes('executing-plans') ||
         prompt.includes('subagent-driven-development') ||
         prompt.includes('/ultrapower:executing-plans') ||
         prompt.includes('/ultrapower:subagent-driven-development');
}

/**
 * Process workflow gate check
 */
export function processWorkflowGate(input: WorkflowGateInput): WorkflowGateOutput {
  const { prompt, workingDirectory } = input;

  let state = readWorkflowState(workingDirectory);
  if (!state) {
    state = initWorkflowState(workingDirectory);
  }

  // Update state based on prompt
  if (detectBrainstormingComplete(prompt)) {
    state.brainstormingComplete = true;
    state.lastStage = 'brainstorming';
    state.timestamp = Date.now();
    writeWorkflowState(workingDirectory, state);
  }

  if (detectPlanComplete(prompt)) {
    state.planWritten = true;
    state.lastStage = 'planning';
    state.timestamp = Date.now();
    writeWorkflowState(workingDirectory, state);
  }

  // Gate 1: Implementation without brainstorming
  if (detectImplementationIntent(prompt) && !state.brainstormingComplete) {
    return {
      success: true,
      shouldBlock: true,
      injectedSkill: 'brainstorming',
      message: '⚠️ Workflow Gate: 在实现之前必须先进行头脑风暴。自动注入 brainstorming skill。'
    };
  }

  // Gate 2: Execution without plan
  if (detectExecutionIntent(prompt) && !state.planWritten) {
    return {
      success: true,
      shouldBlock: true,
      injectedSkill: 'writing-plans',
      message: '⚠️ Workflow Gate: 在执行之前必须先编写计划。自动注入 writing-plans skill。'
    };
  }

  // Gate 3: Using executing-plans or subagent-driven-development without plan
  if (detectPlanExecutionSkill(prompt) && !state.planWritten) {
    return {
      success: true,
      shouldBlock: true,
      injectedSkill: 'writing-plans',
      message: '⚠️ Workflow Gate: 使用 executing-plans 或 subagent-driven-development 前必须先编写计划。自动注入 writing-plans skill。'
    };
  }

  return {
    success: true,
    shouldBlock: false
  };
}

/**
 * Clear workflow state (for testing or manual reset)
 */
export function clearWorkflowState(workingDir: string): void {
  const statePath = getWorkflowStatePath(workingDir);
  if (existsSync(statePath)) {
    require('fs').unlinkSync(statePath);
  }
}

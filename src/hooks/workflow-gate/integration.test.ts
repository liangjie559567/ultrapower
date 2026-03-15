/**
 * Integration test for complete Socratic workflow with quality gates
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  processWorkflowGate,
  initWorkflowState,
  writeWorkflowState,
  type WorkflowGateInput
} from './index.js';

const TEST_DIR = join(process.cwd(), '.test-workflow-integration');

describe('workflow-gate integration', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('enforces complete Socratic workflow from vague request to production', () => {
    // Step 1: Vague request triggers brainstorming
    const input: WorkflowGateInput = {
      type: 'UserPromptSubmit',
      prompt: 'how to add user authentication',
      workingDirectory: TEST_DIR
    };
    let result = processWorkflowGate(input);
    expect(result.shouldBlock).toBe(true);
    expect(result.injectedSkill).toBe('brainstorming');

    // Step 2: After brainstorming, implementation requires plan
    input.prompt = 'brainstorming complete';
    processWorkflowGate(input);

    input.prompt = 'implement authentication';
    result = processWorkflowGate(input);
    expect(result.shouldBlock).toBe(false); // brainstorming done, can proceed

    // Step 3: Execution requires plan
    input.prompt = 'execute the plan';
    result = processWorkflowGate(input);
    expect(result.shouldBlock).toBe(true);
    expect(result.injectedSkill).toBe('writing-plans');

    // Step 4: After plan, execution requires tests (TDD)
    input.prompt = 'plan complete';
    processWorkflowGate(input);

    input.prompt = 'execute the plan';
    result = processWorkflowGate(input);
    expect(result.shouldBlock).toBe(true);
    expect(result.injectedSkill).toBe('test-driven-development');

    // Step 5: After tests, can execute
    input.prompt = 'tests complete';
    processWorkflowGate(input);

    input.prompt = 'execute the plan';
    result = processWorkflowGate(input);
    expect(result.shouldBlock).toBe(false);
  });

  it('triggers security review for auth implementation', () => {
    const state = initWorkflowState(TEST_DIR);
    state.brainstormingComplete = true;
    state.planWritten = true;
    state.testsWritten = true;
    state.executionStarted = true;
    writeWorkflowState(TEST_DIR, state);

    const input: WorkflowGateInput = {
      type: 'UserPromptSubmit',
      prompt: 'implement jwt token authentication',
      workingDirectory: TEST_DIR
    };

    const result = processWorkflowGate(input);
    expect(result.shouldBlock).toBe(true);
    expect(result.injectedSkill).toBe('security-review');
  });

  it('triggers performance review for optimization', () => {
    const state = initWorkflowState(TEST_DIR);
    state.brainstormingComplete = true;
    state.planWritten = true;
    state.testsWritten = true;
    state.executionStarted = true;
    writeWorkflowState(TEST_DIR, state);

    const input: WorkflowGateInput = {
      type: 'UserPromptSubmit',
      prompt: 'optimize database queries with cache',
      workingDirectory: TEST_DIR
    };

    const result = processWorkflowGate(input);
    expect(result.shouldBlock).toBe(true);
    expect(result.injectedSkill).toBe('performance-review');
  });

  it('requires code review before verification', () => {
    const state = initWorkflowState(TEST_DIR);
    state.brainstormingComplete = true;
    state.planWritten = true;
    state.testsWritten = true;
    state.executionStarted = true;
    writeWorkflowState(TEST_DIR, state);

    const input: WorkflowGateInput = {
      type: 'UserPromptSubmit',
      prompt: 'run verification',
      workingDirectory: TEST_DIR
    };

    const result = processWorkflowGate(input);
    expect(result.shouldBlock).toBe(true);
    expect(result.injectedSkill).toBe('code-review');
  });
});

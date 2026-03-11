import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  processWorkflowGate,
  readWorkflowState,
  writeWorkflowState,
  initWorkflowState,
  clearWorkflowState,
  detectImplementationIntent,
  detectExecutionIntent,
  detectBrainstormingComplete,
  detectPlanComplete,
  detectPlanExecutionSkill,
  detectVagueRequest,
  suggestNextStep,
  type WorkflowGateInput
} from './index.js';

const TEST_DIR = join(process.cwd(), '.test-workflow-gate');

describe('workflow-gate', () => {
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

  describe('detectImplementationIntent', () => {
    it('detects English implementation keywords', () => {
      expect(detectImplementationIntent('implement a new feature')).toBe(true);
      expect(detectImplementationIntent('create a component')).toBe(true);
      expect(detectImplementationIntent('add validation')).toBe(true);
      expect(detectImplementationIntent('build the API')).toBe(true);
    });

    it('detects Chinese implementation keywords', () => {
      expect(detectImplementationIntent('实现一个新功能')).toBe(true);
      expect(detectImplementationIntent('创建组件')).toBe(true);
      expect(detectImplementationIntent('添加验证')).toBe(true);
    });

    it('returns false for non-implementation prompts', () => {
      expect(detectImplementationIntent('what is the status?')).toBe(false);
      expect(detectImplementationIntent('explain this code')).toBe(false);
    });
  });

  describe('detectExecutionIntent', () => {
    it('detects execution keywords', () => {
      expect(detectExecutionIntent('execute the plan')).toBe(true);
      expect(detectExecutionIntent('run the implementation')).toBe(true);
      expect(detectExecutionIntent('start building')).toBe(true);
    });
  });

  describe('detectPlanExecutionSkill', () => {
    it('detects executing-plans skill', () => {
      expect(detectPlanExecutionSkill('use executing-plans')).toBe(true);
      expect(detectPlanExecutionSkill('/ultrapower:executing-plans')).toBe(true);
    });

    it('detects subagent-driven-development skill', () => {
      expect(detectPlanExecutionSkill('use subagent-driven-development')).toBe(true);
      expect(detectPlanExecutionSkill('/ultrapower:subagent-driven-development')).toBe(true);
    });
  });

  describe('detectVagueRequest', () => {
    it('detects vague English requests', () => {
      expect(detectVagueRequest('how to implement authentication')).toBe(true);
      expect(detectVagueRequest('what should I do to add a feature')).toBe(true);
      expect(detectVagueRequest('help me build a REST API')).toBe(true);
    });

    it('detects vague Chinese requests', () => {
      expect(detectVagueRequest('如何设计用户认证功能')).toBe(true);
      expect(detectVagueRequest('怎么做一个新功能')).toBe(true);
      expect(detectVagueRequest('帮我构建一个 API')).toBe(true);
    });

    it('ignores short queries', () => {
      expect(detectVagueRequest('how to')).toBe(false);
      expect(detectVagueRequest('help me')).toBe(false);
    });

    it('ignores if brainstorming already mentioned', () => {
      expect(detectVagueRequest('how to implement auth, already did brainstorming')).toBe(false);
    });
  });

  describe('suggestNextStep', () => {
    it('suggests brainstorming when nothing done', () => {
      const state = initWorkflowState(TEST_DIR);
      expect(suggestNextStep(state)).toBe('brainstorming');
    });

    it('suggests writing-plans after brainstorming', () => {
      const state = initWorkflowState(TEST_DIR);
      state.brainstormingComplete = true;
      expect(suggestNextStep(state)).toBe('writing-plans');
    });

    it('suggests using-git-worktrees after planning', () => {
      const state = initWorkflowState(TEST_DIR);
      state.brainstormingComplete = true;
      state.planWritten = true;
      expect(suggestNextStep(state)).toBe('using-git-worktrees');
    });

    it('returns null when workflow complete', () => {
      const state = initWorkflowState(TEST_DIR);
      state.brainstormingComplete = true;
      state.planWritten = true;
      state.worktreeCreated = true;
      state.executionStarted = true;
      state.reviewRequested = true;
      state.verificationComplete = true;
      expect(suggestNextStep(state)).toBe(null);
    });
  });

  describe('state management', () => {
    it('initializes workflow state', () => {
      const state = initWorkflowState(TEST_DIR);
      expect(state.brainstormingComplete).toBe(false);
      expect(state.planWritten).toBe(false);
      expect(state.lastStage).toBe('init');
    });

    it('reads and writes workflow state', () => {
      const state = initWorkflowState(TEST_DIR);
      state.brainstormingComplete = true;
      writeWorkflowState(TEST_DIR, state);

      const loaded = readWorkflowState(TEST_DIR);
      expect(loaded?.brainstormingComplete).toBe(true);
    });

    it('clears workflow state', () => {
      initWorkflowState(TEST_DIR);
      clearWorkflowState(TEST_DIR);
      expect(readWorkflowState(TEST_DIR)).toBe(null);
    });
  });

  describe('processWorkflowGate', () => {
    it('blocks implementation without brainstorming', () => {
      const input: WorkflowGateInput = {
        type: 'UserPromptSubmit',
        prompt: 'implement a new feature',
        workingDirectory: TEST_DIR
      };

      const result = processWorkflowGate(input);
      expect(result.shouldBlock).toBe(true);
      expect(result.injectedSkill).toBe('brainstorming');
    });

    it('allows implementation after brainstorming', () => {
      const state = initWorkflowState(TEST_DIR);
      state.brainstormingComplete = true;
      writeWorkflowState(TEST_DIR, state);

      const input: WorkflowGateInput = {
        type: 'UserPromptSubmit',
        prompt: 'implement a new feature',
        workingDirectory: TEST_DIR
      };

      const result = processWorkflowGate(input);
      expect(result.shouldBlock).toBe(false);
    });

    it('blocks execution without plan', () => {
      const state = initWorkflowState(TEST_DIR);
      state.brainstormingComplete = true;
      writeWorkflowState(TEST_DIR, state);

      const input: WorkflowGateInput = {
        type: 'UserPromptSubmit',
        prompt: 'execute the plan',
        workingDirectory: TEST_DIR
      };

      const result = processWorkflowGate(input);
      expect(result.shouldBlock).toBe(true);
      expect(result.injectedSkill).toBe('writing-plans');
    });

    it('updates state when brainstorming completes', () => {
      initWorkflowState(TEST_DIR);

      const input: WorkflowGateInput = {
        type: 'UserPromptSubmit',
        prompt: 'brainstorming complete',
        workingDirectory: TEST_DIR
      };

      processWorkflowGate(input);
      const state = readWorkflowState(TEST_DIR);
      expect(state?.brainstormingComplete).toBe(true);
    });

    it('blocks executing-plans without plan', () => {
      const state = initWorkflowState(TEST_DIR);
      state.brainstormingComplete = true;
      writeWorkflowState(TEST_DIR, state);

      const input: WorkflowGateInput = {
        type: 'UserPromptSubmit',
        prompt: '/ultrapower:executing-plans',
        workingDirectory: TEST_DIR
      };

      const result = processWorkflowGate(input);
      expect(result.shouldBlock).toBe(true);
      expect(result.injectedSkill).toBe('writing-plans');
    });

    it('blocks subagent-driven-development without plan', () => {
      const state = initWorkflowState(TEST_DIR);
      state.brainstormingComplete = true;
      writeWorkflowState(TEST_DIR, state);

      const input: WorkflowGateInput = {
        type: 'UserPromptSubmit',
        prompt: '/ultrapower:subagent-driven-development',
        workingDirectory: TEST_DIR
      };

      const result = processWorkflowGate(input);
      expect(result.shouldBlock).toBe(true);
      expect(result.injectedSkill).toBe('writing-plans');
    });

    it('auto-triggers brainstorming for vague requests', () => {
      initWorkflowState(TEST_DIR);

      const input: WorkflowGateInput = {
        type: 'UserPromptSubmit',
        prompt: 'what should I do for user authentication',
        workingDirectory: TEST_DIR
      };

      const result = processWorkflowGate(input);
      expect(result.shouldBlock).toBe(true);
      expect(result.injectedSkill).toBe('brainstorming');
      expect(result.message).toContain('自动触发');
    });
  });
});

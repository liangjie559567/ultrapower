import { describe, it, expect, beforeEach } from 'vitest';
import { WizardEngine } from '../engine.js';

describe('WizardEngine', () => {
  let wizard: WizardEngine;

  beforeEach(() => {
    wizard = new WizardEngine();
  });

  describe('问题流程', () => {
    it('初始状态返回 Q1', () => {
      const question = wizard.getNextQuestion();
      expect(question?.id).toBe('q1');
    });

    it('回答 Q1 后返回对应的 Q2', () => {
      wizard.answerQuestion('q1', 'single');
      const question = wizard.getNextQuestion();
      expect(question?.id).toBe('q2_single');
    });

    it('单个功能-简单路径需要 Q3', () => {
      wizard.answerQuestion('q1', 'single');
      wizard.answerQuestion('q2_single', 'simple');
      const question = wizard.getNextQuestion();
      expect(question?.id).toBe('q3_simple');
    });

    it('单个功能-复杂路径不需要 Q3', () => {
      wizard.answerQuestion('q1', 'single');
      wizard.answerQuestion('q2_single', 'complex');
      const question = wizard.getNextQuestion();
      expect(question).toBeNull();
    });

    it('修复问题-多文件路径需要 Q3', () => {
      wizard.answerQuestion('q1', 'fix');
      wizard.answerQuestion('q2_fix', 'multi-file');
      const question = wizard.getNextQuestion();
      expect(question?.id).toBe('q3_multi_file');
    });
  });

  describe('返回上一步', () => {
    it('可以返回到上一个问题', () => {
      wizard.answerQuestion('q1', 'single');
      wizard.answerQuestion('q2_single', 'simple');

      const success = wizard.goBack();
      expect(success).toBe(true);

      const state = wizard.getState();
      expect(state.q1).toBe('single');
      expect(state.q2).toBeUndefined();
    });

    it('初始状态无法返回', () => {
      const success = wizard.goBack();
      expect(success).toBe(false);
    });
  });

  describe('推荐生成', () => {
    it('完整流程生成正确推荐', () => {
      wizard.answerQuestion('q1', 'single');
      wizard.answerQuestion('q2_single', 'simple');
      wizard.answerQuestion('q3_simple', 'continuous');

      const recommendation = wizard.getRecommendation();
      expect(recommendation).toBe('ralph');
    });

    it('未完成流程返回 null', () => {
      const recommendation = wizard.getRecommendation();
      expect(recommendation).toBeNull();
    });
  });

  describe('重置', () => {
    it('重置后恢复初始状态', () => {
      wizard.answerQuestion('q1', 'single');
      wizard.answerQuestion('q2_single', 'complex');

      wizard.reset();

      const state = wizard.getState();
      expect(state.q1).toBeUndefined();
      expect(state.q2).toBeUndefined();

      const question = wizard.getNextQuestion();
      expect(question?.id).toBe('q1');
    });
  });
});

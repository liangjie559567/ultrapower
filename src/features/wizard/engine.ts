/**
 * Wizard Core - 向导核心逻辑
 */

import type { WizardState, Q1Answer, Q2Answer, Q3Answer, Question } from './types.js';
import { questions } from './questions.js';
import { getRecommendation } from './recommendation-engine.js';

export class WizardEngine {
  private state: WizardState = {};
  private history: string[] = [];

  getNextQuestion(): Question | null {
    // Q1: 任务类型
    if (!this.state.q1) {
      return questions.q1;
    }

    // Q2: 根据 Q1 分支
    if (!this.state.q2) {
      const q2Key = `q2_${this.state.q1}`;
      return questions[q2Key] || null;
    }

    // Q3: 根据 Q2 细化
    if (!this.state.q3) {
      if (this.state.q1 === 'single' && this.state.q2 === 'simple') {
        return questions.q3_simple;
      }
      if (this.state.q1 === 'fix' && this.state.q2 === 'multi-file') {
        return questions.q3_multi_file;
      }
      // 其他情况不需要 Q3
      return null;
    }

    return null;
  }

  answerQuestion(questionId: string, answer: string): void {
    this.history.push(questionId);

    if (questionId === 'q1') {
      this.state.q1 = answer as Q1Answer;
    } else if (questionId.startsWith('q2_')) {
      this.state.q2 = answer as Q2Answer;
    } else if (questionId.startsWith('q3_')) {
      this.state.q3 = answer as Q3Answer;
    }
  }

  goBack(): boolean {
    if (this.history.length === 0) return false;

    const lastQuestion = this.history.pop();
    if (!lastQuestion) return false;

    if (lastQuestion === 'q1') {
      this.state.q1 = undefined;
    } else if (lastQuestion.startsWith('q2_')) {
      this.state.q2 = undefined;
    } else if (lastQuestion.startsWith('q3_')) {
      this.state.q3 = undefined;
    }

    return true;
  }

  getRecommendation() {
    if (!this.state.q1) return null;
    return getRecommendation(this.state.q1, this.state.q2, this.state.q3);
  }

  getState(): WizardState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {};
    this.history = [];
  }
}

/**
 * Wizard Core - 向导核心逻辑
 */
import type { WizardState, Question } from './types.js';
export declare class WizardEngine {
    private state;
    private history;
    getNextQuestion(): Question | null;
    answerQuestion(questionId: string, answer: string): void;
    goBack(): boolean;
    getRecommendation(): import("./types.js").ExecutionMode | null;
    getState(): WizardState;
    reset(): void;
}
//# sourceMappingURL=engine.d.ts.map
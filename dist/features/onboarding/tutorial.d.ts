import type { TutorialState } from './types.js';
export declare class TutorialEngine {
    static checkAndRun(): Promise<void>;
    static start(): Promise<void>;
    static resume(state: TutorialState): Promise<void>;
    static runScenarios(): Promise<void>;
    static complete(): Promise<void>;
    static skip(): Promise<void>;
}
//# sourceMappingURL=tutorial.d.ts.map
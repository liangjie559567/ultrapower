import type { TutorialScenario, TutorialStep } from './types.js';
export declare class ScenarioRunner {
    private scenario;
    constructor(scenario: TutorialScenario);
    run(): Promise<boolean>;
    runStep(step: TutorialStep): Promise<boolean>;
}
//# sourceMappingURL=scenario-runner.d.ts.map
export interface TutorialState {
    completed: boolean;
    skipped: boolean;
    completedScenarios: string[];
    startedAt: string;
    completedAt?: string;
    lastExitAt?: string;
    exitCount: number;
    totalTimeSpent: number;
}
export interface TutorialScenario {
    id: string;
    title: string;
    description: string;
    steps: TutorialStep[];
}
export interface TutorialStep {
    id: string;
    title: string;
    instruction: string;
    example?: string;
    validation?: string;
}
export interface AnalyticsEvent {
    type: 'tutorial_start' | 'scenario_complete' | 'tutorial_exit' | 'tutorial_resume' | 'tutorial_complete' | 'tutorial_skip';
    timestamp: string;
    scenario?: string;
    completedScenarios?: string[];
}
//# sourceMappingURL=types.d.ts.map
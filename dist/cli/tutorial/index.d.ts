/**
 * 交互式教程系统
 * 首次运行引导和示例项目
 */
export interface TutorialState {
    completed: boolean;
    skipped: boolean;
    lastStep: number;
    timestamp: number;
}
export declare function isFirstRun(): boolean;
export declare function saveTutorialState(state: TutorialState): void;
export declare function runInteractiveTutorial(): Promise<void>;
export declare function createDemoProject(targetDir: string): Promise<void>;
//# sourceMappingURL=index.d.ts.map
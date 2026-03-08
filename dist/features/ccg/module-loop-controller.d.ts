export interface ModuleInfo {
    path: string;
    name: string;
    dependencies: string[];
}
export interface ModuleLoopResult {
    moduleName: string;
    success: boolean;
    phases: {
        development: boolean;
        review: boolean;
        optimization: boolean;
        testing: boolean;
    };
}
export declare class ModuleLoopController {
    private loopController;
    private workingDir;
    constructor(workingDir: string);
    executeModules(modulePaths: string[]): Promise<ModuleLoopResult[]>;
    private parseModules;
    private extractDependencies;
    private areDependenciesMet;
    private executeModuleLoop;
    private executeDevelopmentPhase;
    private executeReviewPhase;
    private executeOptimizationPhase;
    private executeTestingPhase;
}
//# sourceMappingURL=module-loop-controller.d.ts.map
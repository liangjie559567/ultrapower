export interface ProjectContext {
    hasTests: boolean;
    hasTypeScript: boolean;
    framework?: string;
    recentErrors: string[];
    modifiedFiles: string[];
}
export declare class ContextEnhancer {
    static analyzeProject(cwd: string): ProjectContext;
    private static checkTests;
    private static checkTypeScript;
    private static detectFramework;
}
//# sourceMappingURL=context-enhancer.d.ts.map
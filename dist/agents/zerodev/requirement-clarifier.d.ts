/**
 * requirement-clarifier agent 核心逻辑
 */
interface ProjectMemory {
    techStack?: string[];
    conventions?: Record<string, string>;
}
export declare function loadProjectMemory(): ProjectMemory;
export declare function detectPlatform(input: string, memory?: ProjectMemory): string;
export declare function extractRequirements(input: string): {
    functional: string[];
    nonFunctional: string[];
};
export {};
//# sourceMappingURL=requirement-clarifier.d.ts.map
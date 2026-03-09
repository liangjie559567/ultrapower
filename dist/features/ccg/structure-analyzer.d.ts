import { TechStack } from './tech-stack-detector.js';
export type ProjectStructure = 'frontend-only' | 'backend-only' | 'fullstack-monolith' | 'fullstack-separated' | 'monorepo';
export interface StructureAnalysis {
    structure: ProjectStructure;
    confidence: number;
    reason: string;
}
export declare function analyzeProjectStructure(workingDir: string, techStack: TechStack): Promise<StructureAnalysis>;
//# sourceMappingURL=structure-analyzer.d.ts.map
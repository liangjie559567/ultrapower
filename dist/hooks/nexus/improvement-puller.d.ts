import type { ImprovementSuggestion } from './types.js';
export interface PullResult {
    pulled: number;
    improvements: ImprovementSuggestion[];
}
export declare function getImprovementsDir(directory: string): string;
export declare function loadPendingImprovements(directory: string): ImprovementSuggestion[];
export declare function pullImprovements(directory: string): PullResult;
//# sourceMappingURL=improvement-puller.d.ts.map
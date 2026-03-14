import type { Recommendation } from './types.js';
export interface AutoSelectionResult {
    shouldAuto: boolean;
    recommendation?: Recommendation;
    reason: string;
}
export declare function shouldAutoSelect(prompt: string, confidence: number): boolean;
export declare function autoSelectWorkflow(prompt: string): Promise<AutoSelectionResult>;
//# sourceMappingURL=auto-selector.d.ts.map
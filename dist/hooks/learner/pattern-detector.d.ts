/**
 * pattern-detector.ts — 模式检测器
 *
 * 从 Axiom pattern_detector.py 移植。检测代码中的重复模式。
 */
import type { AxiomConfig } from '../../config/axiom-config.js';
export interface PatternMatch {
    patternName: string;
    matchedFile: string;
    confidence: number;
}
export interface PatternEntry {
    id: string;
    name: string;
    category: string;
    occurrences: number;
    confidence: number;
    status: 'pending' | 'active' | 'deprecated';
    firstSeen: string;
}
export interface DetectionResult {
    newPatterns: string[];
    promoted: string[];
    matches: string[];
}
export declare class PatternDetector {
    private readonly patternFile;
    private readonly promoteThreshold;
    constructor(baseDir?: string, config?: Partial<AxiomConfig['evolution']>);
    detectFromDiff(diffText: string): PatternMatch[];
    loadPatterns(): Promise<PatternEntry[]>;
    detectAndUpdate(diffText: string): Promise<DetectionResult>;
    private writePatterns;
}
//# sourceMappingURL=pattern-detector.d.ts.map
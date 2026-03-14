export type IntentType = 'feature-single' | 'feature-multiple' | 'bug-fix' | 'refactor' | 'review' | 'explore' | 'plan';
export type Intent = IntentType;
export interface ComplexityMetrics {
    file_count: number;
    keyword_weight: number;
    module_count: number;
    complexity_score: number;
}
export interface Recommendation {
    primary?: string;
    secondary?: string;
    workflow?: string;
    reason: string;
    confidence: number;
    alternatives?: string[];
}
export interface AnalysisResult {
    intent: IntentType;
    complexity: ComplexityMetrics;
    recommendation: Recommendation;
    processing_time_ms: number;
}
export interface ContextSignal {
    fileCount: number;
    hasArchitecture: boolean;
    hasSecurity: boolean;
    hasPerformance: boolean;
    hasUI: boolean;
    hasAPI: boolean;
    hasTests: boolean;
}
//# sourceMappingURL=types.d.ts.map
/**
 * Shared types for keyword detector
 */
export type KeywordType = 'cancel' | 'ralph' | 'autopilot' | 'ultrapilot' | 'team' | 'ultrawork' | 'swarm' | 'pipeline' | 'ralplan' | 'plan' | 'tdd' | 'ultrathink' | 'deepsearch' | 'analyze' | 'codex' | 'gemini' | 'ccg';
export interface DetectedKeyword {
    type: KeywordType;
    keyword: string;
    position: number;
}
//# sourceMappingURL=types.d.ts.map
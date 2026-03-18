/**
 * Shared types for keyword detector
 */

export type KeywordType =
  | 'cancel'      // Priority 1
  | 'ralph'       // Priority 2
  | 'autopilot'   // Priority 3
  | 'ultrapilot'  // Priority 4
  | 'team'        // Priority 4.5 (team mode)
  | 'ultrawork'   // Priority 5
  | 'swarm'       // Priority 6
  | 'pipeline'    // Priority 7
  | 'ralplan'     // Priority 8
  | 'plan'        // Priority 9
  | 'tdd'         // Priority 10
  | 'ultrathink'  // Priority 11
  | 'deepsearch'  // Priority 12
  | 'analyze'     // Priority 13
  | 'codex'       // Priority 14
  | 'gemini'      // Priority 15
  | 'ccg';        // Priority 8.5 (Claude-Codex-Gemini orchestration)

export interface DetectedKeyword {
  type: KeywordType;
  keyword: string;
  position: number;
}

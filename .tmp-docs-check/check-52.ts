export type KeywordType =
  | 'cancel'      // Priority 1
  | 'ralph'       // Priority 2
  | 'autopilot'   // Priority 3
  | 'ultrapilot'  // Priority 4
  | 'team'        // Priority 4.5
  | 'ultrawork'   // Priority 5
  | 'swarm'       // Priority 6
  | 'pipeline'    // Priority 7
  | 'ccg'         // Priority 8.5 (Claude-Codex-Gemini)
  | 'ralplan'     // Priority 8
  | 'plan'        // Priority 9
  | 'tdd'         // Priority 10
  | 'ultrathink'  // Priority 11
  | 'deepsearch'  // Priority 12
  | 'analyze'     // Priority 13
  | 'codex'       // Priority 14
  | 'gemini';     // Priority 15

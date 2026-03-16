interface AutopilotConfig {
  maxIterations?: number;           // 默认：10
  maxExpansionIterations?: number;  // 默认：2
  maxArchitectIterations?: number;  // 默认：5
  maxQaCycles?: number;             // 默认：5
  maxValidationRounds?: number;     // 默认：3
  parallelExecutors?: number;       // 默认：5
  pauseAfterExpansion?: boolean;    // 默认：false
  pauseAfterPlanning?: boolean;     // 默认：false
  skipQa?: boolean;                 // 默认：false
  skipValidation?: boolean;         // 默认：false
  autoCommit?: boolean;             // 默认：false
}

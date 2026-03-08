import { executeRequirementPhase } from './phase-requirement.js';
import { executeDevelopmentPhase } from './phase-development.js';
import { executeOptimizationLoop } from './phase-optimization.js';
import { executeTestingLoop } from './phase-testing.js';

export interface WorkflowConfig {
  workingDir: string;
  maxOptimizationRounds?: number;
  maxTestingRounds?: number;
}

export class NewProjectWorkflow {
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = {
      maxOptimizationRounds: 5,
      maxTestingRounds: 10,
      ...config,
    };
  }

  async execute(): Promise<void> {
    await executeRequirementPhase(this.config.workingDir);
    await executeDevelopmentPhase(this.config.workingDir);
    await executeOptimizationLoop(this.config.workingDir, this.config.maxOptimizationRounds!);
    await executeTestingLoop(this.config.workingDir, this.config.maxTestingRounds!);
  }
}

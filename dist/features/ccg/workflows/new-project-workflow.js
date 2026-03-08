import { executeRequirementPhase } from './phase-requirement.js';
import { executeDevelopmentPhase } from './phase-development.js';
import { executeOptimizationLoop } from './phase-optimization.js';
import { executeTestingLoop } from './phase-testing.js';
export class NewProjectWorkflow {
    config;
    constructor(config) {
        this.config = {
            maxOptimizationRounds: 5,
            maxTestingRounds: 10,
            ...config,
        };
    }
    async execute() {
        await executeRequirementPhase(this.config.workingDir);
        await executeDevelopmentPhase(this.config.workingDir);
        await executeOptimizationLoop(this.config.workingDir, this.config.maxOptimizationRounds);
        await executeTestingLoop(this.config.workingDir, this.config.maxTestingRounds);
    }
}
//# sourceMappingURL=new-project-workflow.js.map
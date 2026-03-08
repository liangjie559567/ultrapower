import { executeReadStatusPhase } from './phase-read-status.js';
import { executeModificationPlanPhase } from './phase-modification-plan.js';
import { executeModuleSplitPhase } from './phase-module-split.js';
import { ModuleLoopController } from '../module-loop-controller.js';
export class OldProjectWorkflow {
    config;
    moduleController;
    constructor(config) {
        this.config = config;
        this.moduleController = new ModuleLoopController(config.workingDir);
    }
    async execute() {
        await executeReadStatusPhase(this.config.workingDir);
        await executeModificationPlanPhase(this.config.workingDir);
        const modules = await executeModuleSplitPhase(this.config.workingDir);
        await this.moduleController.executeModules(modules);
    }
}
//# sourceMappingURL=old-project-workflow.js.map
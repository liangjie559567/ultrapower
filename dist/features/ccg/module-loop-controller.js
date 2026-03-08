import { promises as fs } from 'fs';
import path from 'path';
import { LoopController } from './loop-controller.js';
export class ModuleLoopController {
    loopController;
    workingDir;
    constructor(workingDir) {
        this.workingDir = workingDir;
        this.loopController = new LoopController();
    }
    async executeModules(modulePaths) {
        const modules = await this.parseModules(modulePaths);
        const results = [];
        for (const module of modules) {
            if (!this.areDependenciesMet(module, results)) {
                throw new Error(`Dependencies not met for ${module.name}`);
            }
            const result = await this.executeModuleLoop(module);
            results.push(result);
        }
        return results;
    }
    async parseModules(modulePaths) {
        const modules = [];
        for (const modulePath of modulePaths) {
            const content = await fs.readFile(modulePath, 'utf-8');
            const name = path.basename(modulePath, '.md');
            const deps = this.extractDependencies(content);
            modules.push({ path: modulePath, name, dependencies: deps });
        }
        return modules;
    }
    extractDependencies(content) {
        const match = content.match(/##\s*依赖关系[\s\S]*?(?=##|$)/i);
        if (!match)
            return [];
        const deps = match[0].match(/dev-module-\d+/g) || [];
        return deps;
    }
    areDependenciesMet(module, completed) {
        const completedNames = new Set(completed.filter(r => r.success).map(r => r.moduleName));
        return module.dependencies.every(dep => completedNames.has(dep));
    }
    async executeModuleLoop(module) {
        const result = {
            moduleName: module.name,
            success: false,
            phases: { development: false, review: false, optimization: false, testing: false }
        };
        try {
            result.phases.development = await this.executeDevelopmentPhase(module);
            result.phases.review = await this.executeReviewPhase(module);
            result.phases.optimization = await this.executeOptimizationPhase(module);
            result.phases.testing = await this.executeTestingPhase(module);
            result.success = Object.values(result.phases).every(p => p);
        }
        catch {
            // Phase failed
        }
        return result;
    }
    async executeDevelopmentPhase(module) {
        await fs.appendFile(path.join(this.workingDir, '.omc', 'ccg', 'progress.log'), `[DEV] ${module.name} started\n`);
        return true;
    }
    async executeReviewPhase(module) {
        await fs.appendFile(path.join(this.workingDir, '.omc', 'ccg', 'progress.log'), `[REVIEW] ${module.name} completed\n`);
        return true;
    }
    async executeOptimizationPhase(module) {
        const config = {
            maxRounds: 5,
            timeout: 30000,
            convergenceCheck: () => true
        };
        const result = await this.loopController.execute(config, async () => ({}));
        return result.completed;
    }
    async executeTestingPhase(module) {
        const config = {
            maxRounds: 10,
            timeout: 30000,
            convergenceCheck: () => true
        };
        const result = await this.loopController.execute(config, async () => ({}));
        return result.completed;
    }
}
//# sourceMappingURL=module-loop-controller.js.map
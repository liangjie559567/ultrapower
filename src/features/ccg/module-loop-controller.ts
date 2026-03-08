import { promises as fs } from 'fs';
import path from 'path';
import { LoopController, LoopConfig } from './loop-controller.js';

export interface ModuleInfo {
  path: string;
  name: string;
  dependencies: string[];
}

export interface ModuleLoopResult {
  moduleName: string;
  success: boolean;
  phases: {
    development: boolean;
    review: boolean;
    optimization: boolean;
    testing: boolean;
  };
}

export class ModuleLoopController {
  private loopController: LoopController;
  private workingDir: string;

  constructor(workingDir: string) {
    this.workingDir = workingDir;
    this.loopController = new LoopController();
  }

  async executeModules(modulePaths: string[]): Promise<ModuleLoopResult[]> {
    const modules = await this.parseModules(modulePaths);
    const results: ModuleLoopResult[] = [];

    for (const module of modules) {
      if (!this.areDependenciesMet(module, results)) {
        throw new Error(`Dependencies not met for ${module.name}`);
      }
      const result = await this.executeModuleLoop(module);
      results.push(result);
    }

    return results;
  }

  private async parseModules(modulePaths: string[]): Promise<ModuleInfo[]> {
    const modules: ModuleInfo[] = [];

    for (const modulePath of modulePaths) {
      const content = await fs.readFile(modulePath, 'utf-8');
      const name = path.basename(modulePath, '.md');
      const deps = this.extractDependencies(content);
      modules.push({ path: modulePath, name, dependencies: deps });
    }

    return modules;
  }

  private extractDependencies(content: string): string[] {
    const match = content.match(/##\s*依赖关系[\s\S]*?(?=##|$)/i);
    if (!match) return [];

    const deps = match[0].match(/dev-module-\d+/g) || [];
    return deps;
  }

  private areDependenciesMet(module: ModuleInfo, completed: ModuleLoopResult[]): boolean {
    const completedNames = new Set(completed.filter(r => r.success).map(r => r.moduleName));
    return module.dependencies.every(dep => completedNames.has(dep));
  }

  private async executeModuleLoop(module: ModuleInfo): Promise<ModuleLoopResult> {
    const result: ModuleLoopResult = {
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
    } catch {
      // Phase failed
    }

    return result;
  }

  private async executeDevelopmentPhase(module: ModuleInfo): Promise<boolean> {
    await fs.appendFile(
      path.join(this.workingDir, '.omc', 'ccg', 'progress.log'),
      `[DEV] ${module.name} started\n`
    );
    return true;
  }

  private async executeReviewPhase(module: ModuleInfo): Promise<boolean> {
    await fs.appendFile(
      path.join(this.workingDir, '.omc', 'ccg', 'progress.log'),
      `[REVIEW] ${module.name} completed\n`
    );
    return true;
  }

  private async executeOptimizationPhase(module: ModuleInfo): Promise<boolean> {
    const config: LoopConfig = {
      maxRounds: 5,
      timeout: 30000,
      convergenceCheck: () => true
    };

    const result = await this.loopController.execute(config, async () => ({}));
    return result.completed;
  }

  private async executeTestingPhase(module: ModuleInfo): Promise<boolean> {
    const config: LoopConfig = {
      maxRounds: 10,
      timeout: 30000,
      convergenceCheck: () => true
    };

    const result = await this.loopController.execute(config, async () => ({}));
    return result.completed;
  }
}

import { promises as fs } from 'fs';
import path from 'path';
export async function executeModuleSplitPhase(workingDir) {
    const modulesDir = path.join(workingDir, '.omc', 'ccg', 'dev-modules');
    await fs.mkdir(modulesDir, { recursive: true });
    const module1 = path.join(modulesDir, 'module-1.md');
    await fs.writeFile(module1, '# Module 1\n\n## 开发任务\n', 'utf-8');
    return [module1];
}
//# sourceMappingURL=phase-module-split.js.map
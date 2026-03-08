import * as fs from 'fs/promises';
import * as path from 'path';
import { createDocFromTemplate } from '../doc-manager.js';
export async function executeRequirementPhase(workingDir) {
    const requirementsDoc = await createDocFromTemplate('requirements', {
        projectName: path.basename(workingDir),
        date: new Date().toISOString().split('T')[0],
    });
    const techDesignDoc = await createDocFromTemplate('tech-design', {
        projectName: path.basename(workingDir),
        date: new Date().toISOString().split('T')[0],
    });
    const docsDir = path.join(workingDir, '.ccg', 'docs');
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(path.join(docsDir, 'requirements.md'), requirementsDoc);
    await fs.writeFile(path.join(docsDir, 'tech-design.md'), techDesignDoc);
}
//# sourceMappingURL=phase-requirement.js.map
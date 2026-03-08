import * as fs from 'fs/promises';
import * as path from 'path';
import { createDocFromTemplate } from '../doc-manager.js';
export async function executeOptimizationLoop(workingDir, maxRounds) {
    const docsDir = path.join(workingDir, '.ccg', 'docs');
    for (let round = 1; round <= maxRounds; round++) {
        const optimizationDoc = await createDocFromTemplate('optimization-list', {
            round: round.toString(),
            date: new Date().toISOString().split('T')[0],
        });
        await fs.writeFile(path.join(docsDir, `optimization-round-${round}.md`), optimizationDoc);
        if (optimizationDoc.includes('无优化点')) {
            break;
        }
    }
}
//# sourceMappingURL=phase-optimization.js.map